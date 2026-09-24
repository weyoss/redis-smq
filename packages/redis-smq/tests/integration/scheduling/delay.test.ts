/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EMessagePropertyStatus,
  EQueueType,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { startScheduleWorker } from '../../helpers/workers/schedule-worker.js';

/**
 * Integration tests for the `setScheduledDelay` parameter.
 *
 * A message produced with `.setScheduledDelay(ms)` lands in the
 * scheduled list with a score of `producedAt + ms`. A
 * `PublishScheduledWorker` polls the scheduled list and moves messages
 * whose score is in the past to the pending list, where normal delivery
 * takes over.
 *
 * RedisSMQ's contract for the delay is:
 *
 *   - The message is not moved before `ms` milliseconds have elapsed
 *     since it was produced.
 *   - The message is moved within a bounded window after that — the
 *     bound depends on the worker's tick interval and the polling
 *     overhead of the running worker cluster.
 *
 * The tests below assert a range, not a point. The lower bound is the
 * contract; the upper bound catches a wedged pipeline. See
 * `retry-delay.test.ts` for the same reasoning applied to a different
 * scheduling mechanism — the two are separate workers but share the
 * same "delay then worker-tick" shape.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The scheduled delay used by the positive test.
 *
 * 10 seconds is long enough to be unambiguously a delay (rather than
 * an immediate publish that happened to be slow) and short enough that
 * the test completes in a reasonable window. Shorter values — say, 1
 * second — would risk the worker's first tick arriving after the
 * message had already become eligible, collapsing the "delay was
 * applied" observation into noise.
 */
const SCHEDULED_DELAY_MS = 10_000;

/**
 * A delay far enough in the future that the worker's ticks cannot reach
 * it during the test.
 *
 * 5 minutes. The negative test waits only a few seconds, so any value
 * comfortably above the test's own duration would work; the specific
 * value is chosen to make the intent obvious in the test body.
 */
const LONG_DELAY_MS = 300_000;

/**
 * Upper bound on RedisSMQ's response latency after the delay
 * elapses.
 *
 * The worker cluster ticks on its own schedule, and each tick runs the
 * `PublishScheduledWorker` once. The total latency between "the message
 * became eligible" and "the message is in the pending list" is
 * therefore one worker tick plus the batch processing overhead.
 *
 * 10 seconds is generous. The observed latency on the current
 * environment is on the order of 1–2 seconds; 10 gives headroom for CI
 * jitter without becoming so loose that a wedged worker would pass.
 * A genuinely stuck pipeline is caught by the `waitForMessageStatus`
 * timeout, which fires before this bound would.
 */
const MAX_OVERHEAD_MS = 10_000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Scheduling with a delay', () => {
  // -------------------------------------------------------------------------
  // Positive: the delay elapses and the message moves
  // -------------------------------------------------------------------------

  it('moves the message to pending after the delay elapses', async () => {
    const queue = uniqueQueue('sched-delay');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const producedAt = Date.now();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('delayed')
        .setScheduledDelay(SCHEDULED_DELAY_MS),
    );

    // Without a worker running, the message is unambiguously in the
    // scheduled list. This pre-state assertion is the reason the test
    // can attribute a subsequent transition to the worker rather than
    // to some produce-time behavior.
    const scheduled = RedisSMQ.createQueueScheduledMessages();
    expect(await scheduled.countMessages(queue)).toBe(1);

    // Start the worker. It will poll `keyQueueScheduled` on its own
    // schedule and move the message once its score is in the past.
    await startScheduleWorker(queue);

    // Wait for the transition. The `waitForMessageStatus` timeout is
    // longer than the maximum expected elapsed time so a wedged worker
    // fails with a specific "message never reached PENDING" message
    // rather than a generic test timeout.
    await waitForMessageStatus(id, EMessagePropertyStatus.PENDING, {
      timeoutMs: SCHEDULED_DELAY_MS + MAX_OVERHEAD_MS + 5000,
      description: `message ${id} reached PENDING after its delay elapsed`,
    });

    // The message's `publishedAt` is stamped by RedisSMQ at the
    // moment of the transition. Comparing it to the produce timestamp
    // measures RedisSMQ's response without including the test's
    // own polling latency.
    const message = await RedisSMQ.createMessageManager().getMessageById(id);
    const publishedAt = message.messageState.publishedAt;

    // A null or missing `publishedAt` would make the interval
    // comparison below meaningless — both bounds would compare against
    // `undefined` and the assertions would pass for the wrong reason.
    // The type guard converts that into a specific failure.
    expect(typeof publishedAt).toBe('number');
    expect(publishedAt).toBeGreaterThan(0);

    const elapsed = publishedAt! - producedAt;

    // The delay was applied — the message did not move earlier than
    // the configured delay.
    expect(
      elapsed,
      `message was published ${elapsed}ms after produce, ` +
        `expected at least ${SCHEDULED_DELAY_MS}ms (the configured delay)`,
    ).toBeGreaterThanOrEqual(SCHEDULED_DELAY_MS);

    // And the delay was not extended unreasonably — the worker
    // responded within the expected window.
    expect(
      elapsed,
      `message was published ${elapsed}ms after produce, ` +
        `expected at most ${SCHEDULED_DELAY_MS + MAX_OVERHEAD_MS}ms ` +
        `(delay + max worker overhead)`,
    ).toBeLessThanOrEqual(SCHEDULED_DELAY_MS + MAX_OVERHEAD_MS);

    // Post-state: the message left the scheduled list and entered the
    // pending list. Asserting both halves confirms the transition was a
    // move, not a duplicate.
    expect(await scheduled.countMessages(queue)).toBe(0);

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(1);

    // And the aggregate view agrees: nothing scheduled, one pending.
    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const counts = await queueMessages.countMessagesByStatus(queue);
    expect(counts).toEqual({
      pending: 1,
      acknowledged: 0,
      deadLettered: 0,
      scheduled: 0,
    });
  });

  // -------------------------------------------------------------------------
  // Negative: a future delay is not moved
  // -------------------------------------------------------------------------

  it('does not move a message whose delay has not yet elapsed', async () => {
    const queue = uniqueQueue('sched-delay-future');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('long-delay')
        .setScheduledDelay(LONG_DELAY_MS),
    );

    const scheduled = RedisSMQ.createQueueScheduledMessages();
    expect(await scheduled.countMessages(queue)).toBe(1);

    // Start the worker. It has several ticks within the settle window
    // below; any of them would move the message if the eligibility
    // check were wrong.
    await startScheduleWorker(queue);

    // Settle window. 3 seconds is longer than the worker's tick
    // interval, so at least one tick has run. A bug that moved the
    // message prematurely would have done so by now.
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // The message is still scheduled.
    expect(await scheduled.countMessages(queue)).toBe(1);

    // The pending list never saw it.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    // The message's own status agrees with the scheduled-list count.
    // This reads through RedisSMQ's accessor rather than the
    // list-storage accessor, so a divergence between the two would
    // surface here.
    const status = await RedisSMQ.createMessageManager().getMessageStatus(id);
    expect(status).toBe(EMessagePropertyStatus.SCHEDULED);
  });
});
