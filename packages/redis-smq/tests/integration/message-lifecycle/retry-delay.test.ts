/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EMessagePropertyStatus,
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the delayed-retry branch.
 *
 * When a message fails and the retry policy allows another attempt, the
 * framework's unack pipeline chooses between two outcomes based on
 * `retryDelay`:
 *
 *     retryDelay == 0   →  REQUEUE   (immediate: message goes back to
 *                                     `keyQueuePending` via the
 *                                     RequeueImmediateWorker)
 *
 *     retryDelay > 0    →  DELAY     (message goes to `keyQueueDelayed`
 *                                     with a score of `now + retryDelay`,
 *                                     then is moved back to pending by
 *                                     the RequeueDelayedWorker once the
 *                                     score elapses)
 *
 * The immediate branch is covered in `retry-on-failure.test.ts`. This
 * file covers the delayed branch, asserting the two observable
 * consequences:
 *
 *   1. The message passes through the `UNACK_DELAYING` status, which
 *      persists for the duration of `retryDelay`.
 *
 *   2. The interval between the first handler invocation and the second
 *      is at least `retryDelay` and at most `retryDelay + overhead`,
 *      where overhead is RedisSMQ's own pipeline latency.
 *
 * DELAY MECHANISM (for readers unfamiliar with the pipeline):
 *
 *   The unack script sets the message status to `UNACK_REQUEUING` and
 *   places it in `keyQueueRequeued` (an intermediate list). A worker
 *   (`RequeueImmediateWorker`) picks it up on its next tick and moves it
 *   to either `keyQueuePending` (immediate case) or `keyQueueDelayed`
 *   (delayed case) based on `retryDelay`. If delayed, the message's
 *   status becomes `UNACK_DELAYING`. Another worker
 *   (`RequeueDelayedWorker`) runs periodically, reads messages from the
 *   delayed set whose score is now in the past, and moves them to
 *   pending. The consumer's dequeue loop then picks up the pending
 *   message for the retry.
 *
 *   The total interval between handler invocations therefore includes
 *   the configured `retryDelay` plus two worker ticks (requeue → delay,
 *   delay → pending) plus the consumer's dequeue poll.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The retry delay used by both tests.
 *
 * 5000ms is long enough to distinguish the delay from worker-tick
 * overhead (which is on the order of 1s per transition), and long
 * enough that `waitForMessageStatus` — polling at 50ms — reliably
 * observes the `UNACK_DELAYING` window.
 */
const RETRY_DELAY_MS = 5000;

/**
 * Upper bound on RedisSMQ's pipeline overhead for a delayed retry.
 *
 * The overhead — measured across the two worker-tick transitions
 * (requeued → delayed, delayed → pending) and the dequeue poll — is
 * variable. Two runs on the current environment showed 3780ms and
 * 6453ms; the true distribution is somewhere in that range with
 * non-trivial variance.
 *
 * 8000ms is set above the upper end of the observed range with ~1500ms
 * of slack for CI jitter. It is not tight — a slack of several seconds
 * means the bound catches only gross wedges, not subtle increases in
 * pipeline latency. That is intentional: the tight assertion is the
 * *lower* bound (the delay was applied), and the upper bound is
 * defense-in-depth against a runaway pipeline. Genuinely wedged
 * pipelines are caught by the `waitForMessageStatus` timeout (30s),
 * which fires before the timing assertion would.
 *
 * If a future run exceeds 13000ms, the message will name the actual
 * interval. Two interpretations:
 *
 *   - A modest overage (13000–16000ms) is environment variance; raise
 *     the constant.
 *
 *   - A large overage (20000ms+) suggests the delayed-requeue worker
 *     is failing or slow, which is a real problem worth investigating
 *     separately.
 */
const MAX_OVERHEAD_MS = 8000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Delayed retry', () => {
  // -------------------------------------------------------------------------
  // Timing
  // -------------------------------------------------------------------------

  it('delays the retry by at least retryDelay milliseconds', async () => {
    const queue = uniqueQueue('retry-delay-timing');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Record a timestamp at each handler invocation. The array is the
    // ground truth for "when did RedisSMQ deliver the message".
    // Using `Date.now()` inside the handler rather than reading the
    // message's state from Redis keeps the observation in-process and
    // avoids a round-trip that would inflate the measured interval.
    const timestamps: number[] = [];

    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        timestamps.push(Date.now());
        if (timestamps.length === 1) {
          cb(new Error('first attempt fails'));
        } else {
          cb();
        }
      },
    });

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('delayed-retry')
        .setRetryThreshold(3)
        .setRetryDelay(RETRY_DELAY_MS),
    );

    await consumer.run();

    await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
      // Generous timeout: retryDelay + two worker ticks + dequeue poll,
      // with slack for slow CI. Must exceed the upper bound below;
      // otherwise the waitFor times out before the timing assertion
      // gets a chance to name the interval.
      timeoutMs: 30_000,
      description: `message ${id} acknowledged after a delayed retry`,
    });

    // Exactly two deliveries: one failure, one success.
    expect(timestamps).toHaveLength(2);

    const interval = timestamps[1] - timestamps[0];

    // The interval must be at least the configured delay. A smaller
    // interval would mean RedisSMQ skipped or shortened the
    // delay — the primary contract this test exists to verify.
    expect(
      interval,
      `interval between first and second delivery (${interval}ms) ` +
        `must be at least retryDelay (${RETRY_DELAY_MS}ms)`,
    ).toBeGreaterThanOrEqual(RETRY_DELAY_MS);

    // And it must not exceed the delay plus RedisSMQ's overhead.
    // The upper bound is loose (see MAX_OVERHEAD_MS); it catches gross
    // runaway behavior, not subtle latency increases.
    expect(
      interval,
      `interval between first and second delivery (${interval}ms) ` +
        `must not exceed retryDelay + MAX_OVERHEAD (${RETRY_DELAY_MS + MAX_OVERHEAD_MS}ms)`,
    ).toBeLessThanOrEqual(RETRY_DELAY_MS + MAX_OVERHEAD_MS);
  });

  // -------------------------------------------------------------------------
  // State flow
  // -------------------------------------------------------------------------

  it('passes through the UNACK_DELAYING state during the delay', async () => {
    const queue = uniqueQueue('retry-delay-state');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    let callCount = 0;
    const consumer = await getConsumer({
      queue,
      messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
        callCount += 1;
        if (callCount === 1) {
          cb(new Error('first attempt fails'));
        } else {
          cb();
        }
      },
    });

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('delayed-retry-state')
        .setRetryThreshold(3)
        .setRetryDelay(RETRY_DELAY_MS),
    );

    await consumer.run();

    // Wait for the message to reach UNACK_DELAYING. The transition
    // happens after `RequeueImmediateWorker` moves the message out of
    // `keyQueueRequeued` and into `keyQueueDelayed`. The state then
    // persists for retryDelay ms — long enough for 50ms polling to
    // observe it reliably.
    //
    // The polling predicate reads the state from Redis, so this does
    // not require an event subscription. Polling is the right tool
    // here: the state is a durable value, not a transient event.
    await waitForMessageStatus(id, EMessagePropertyStatus.UNACK_DELAYING, {
      timeoutMs: 10_000,
      description: `message ${id} reached UNACK_DELAYING`,
    });

    // Then wait for the retry to complete. The RequeueDelayedWorker
    // moves the message back to pending once the delay elapses, and
    // the consumer picks it up for the second delivery, which acks.
    await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED, {
      timeoutMs: 20_000,
      description: `message ${id} acknowledged after the delay elapsed`,
    });

    // The handler was invoked exactly twice — once for the failure,
    // once for the successful retry. A third invocation would indicate
    // RedisSMQ retried more than intended; a single invocation
    // would indicate the retry never happened.
    expect(callCount).toBe(2);
  });
});
