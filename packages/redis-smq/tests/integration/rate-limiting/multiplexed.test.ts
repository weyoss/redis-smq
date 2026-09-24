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
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for rate limiting across a multiplexed consumer
 * registered on multiple queues.
 *
 * A consumer built with `enableMultiplexing: true` uses a single shared
 * poller across all its registered queues, instead of a worker per
 * queue. When several of those queues have rate limits set, the
 * limiter's per-queue accounting must remain independent: exhausting
 * queue A's window must not consume queue B's tokens.
 *
 * THE RATE LIMIT IS PER-QUEUE:
 *
 *   RedisSMQ stores a queue's rate limit under a key derived from
 *   the queue's namespace and name (`keyQueueRateLimit`, built by
 *   `keys.getQueueKeys(queue.ns, queue.name, null)`). Two queues have
 *   two distinct keys, so the underlying Redis script
 *   (`CHECK_QUEUE_RATE_LIMIT`) maintains two independent counters.
 *
 *   The failure mode this test is designed to catch: a regression that
 *   dropped the queue name from the key derivation, or that keyed the
 *   counter off the consumer or the poller rather than the queue. Under
 *   such a bug, the first batch of deliveries against one queue would
 *   exhaust the shared counter, and the other queue's messages would be
 *   held until the next window — visibly wrong on the wall clock, and
 *   invisible to the single-queue tests (`fifo.test.ts`,
 *   `priority.test.ts`, `many-consumers.test.ts`), which only ever
 *   exercise one queue at a time.
 *
 * WHY TWO DIFFERENT LIMITS:
 *
 *   Using different limits (`limit: 2` vs `limit: 4`) makes the bug
 *   easy to distinguish from the correct behavior in the assertion
 *   output:
 *
 *     Correct (independent windows):
 *       A delivers 2, B delivers 4 — all within the same window
 *
 *     Buggy (shared counter with limit=2, the first encountered):
 *       2 deliveries in the first window, remaining 4 held until the
 *       second window opens ~10s later
 *
 *     Buggy (shared counter with limit=4, the larger):
 *       4 deliveries in the first window, remaining 2 held until the
 *       second window
 *
 *   Equal limits would still distinguish (the correct behavior would
 *   deliver `2 * limit` in the first window, the buggy one only
 *   `limit`), but the mapping from "which queue delivered how many" to
 *   "which counter was used" is less direct. Different limits make the
 *   diagnosis immediate from the failure output.
 *
 * WHY THE TIMEOUT IS 8 SECONDS:
 *
 *   The multiplexed consumer's poller delivers roughly one message per
 *   second across its registered queues — this is the same tick
 *   interval observed in `consuming/multiplexed-consumer.test.ts`,
 *   where a batch of 5 messages takes about 5 seconds. With 6 messages
 *   here, the expected wall time on the correct behavior is ~6s, so
 *   the timeout must be comfortably above that.
 *
 *   8 seconds gives 2 seconds of headroom for a loaded CI while
 *   remaining strictly below the rate-limit interval (10s). The
 *   constraint matters: if the timeout were ≥ 10s, the buggy behavior
 *   could deliver its first window's worth of messages, wait for the
 *   window to roll, and *then* deliver the rest — all still within the
 *   timeout — and the test would pass for the wrong reason.
 *
 *   The 2-second headroom is the trade-off. If a future CI machine is
 *   slower and this test starts failing with "N of 6 delivered" where
 *   N is 5, bump the timeout to 9s (still below 10s) — do not remove
 *   the headroom constraint.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Rate limit for the first queue. Small enough that the first window's
 * allowance is easy to count, and distinct from `B_LIMIT` so the
 * assertion output names which queue's counter was used.
 */
const A_LIMIT = { limit: 2, interval: 10_000 } as const;

/**
 * Rate limit for the second queue. Deliberately larger than `A_LIMIT`
 * so the "independent vs shared" signal is unambiguous in the failure
 * output — see the file header.
 */
const B_LIMIT = { limit: 4, interval: 10_000 } as const;

/**
 * Total messages produced across both queues. Equal to
 * `A_LIMIT.limit + B_LIMIT.limit`, so the correct behavior drains the
 * pending lists exactly once.
 */
const TOTAL_MESSAGES = A_LIMIT.limit + B_LIMIT.limit;

/**
 * Timeout for observing all deliveries.
 *
 * Expected wall time on the correct behavior: ~6s (6 messages at the
 * multiplexed consumer's ~1s/message delivery rate). 8s gives 2s of
 * headroom.
 *
 * Must remain strictly below `A_LIMIT.interval` (10s) — see the file
 * header for why. If a slower CI causes flakiness, raise to 9s rather
 * than removing the headroom constraint.
 */
const DELIVERY_TIMEOUT_MS = 8000;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Delivery timestamp captured per queue. Grouping the two arrays in a
 * single record keeps the handler closure simple and makes the
 * per-queue assertions read as `deliveries.a` / `deliveries.b` rather
 * than two separate top-level variables.
 */
interface IDeliveries {
  a: number[];
  b: number[];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Rate limiting — multiplexed consumer across two queues', () => {
  it('enforces each queue\u2019s limit independently when one consumer serves both', async () => {
    const queueA = uniqueQueue('rl-mux-a');
    const queueB = uniqueQueue('rl-mux-b');
    await createQueue(queueA, EQueueType.FIFO_QUEUE);
    await createQueue(queueB, EQueueType.FIFO_QUEUE);

    // Set each queue's limit. As in the sibling enforcement files, the
    // pre-state `get` guards against a silent setup failure that would
    // leave one or both queues unlimited.
    const rateLimit = RedisSMQ.createQueueRateLimitManager();
    await rateLimit.set(queueA, A_LIMIT);
    await rateLimit.set(queueB, B_LIMIT);
    expect(await rateLimit.get(queueA)).toEqual(A_LIMIT);
    expect(await rateLimit.get(queueB)).toEqual(B_LIMIT);

    // Produce each queue's first-window allowance, before the consumer
    // starts. A consumer started earlier would race the produce calls,
    // and the "all N messages pending" pre-state check below would not
    // hold.
    const producer = await startProducer();
    for (let i = 0; i < A_LIMIT.limit; i += 1) {
      await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queueA).setBody(`a-${i}`),
      );
    }
    for (let i = 0; i < B_LIMIT.limit; i += 1) {
      await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queueB).setBody(`b-${i}`),
      );
    }

    // Pre-state: every produced message is pending.
    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queueA)).toBe(A_LIMIT.limit);
    expect(await pending.countMessages(queueB)).toBe(B_LIMIT.limit);

    // Register a multiplexed consumer on both queues. The handler is
    // per-queue (each `consume()` call supplies its own), and each
    // records the delivery timestamp in the appropriate array.
    const deliveries: IDeliveries = { a: [], b: [] };

    const consumer = createBareConsumer({ enableMultiplexing: true });
    await consumer.consume(
      queueA,
      (_msg: IMessageTransferable, cb: ICallback) => {
        deliveries.a.push(Date.now());
        cb();
      },
    );
    await consumer.consume(
      queueB,
      (_msg: IMessageTransferable, cb: ICallback) => {
        deliveries.b.push(Date.now());
        cb();
      },
    );

    await consumer.run();

    // Wait for the total count. The correct behavior resolves this in
    // ~6s (one delivery per ~second across the shared poller). The
    // buggy behavior (shared counter) cannot resolve it before the
    // second window opens at ~10s, so the waitFor times out with the
    // observed count named in the failure message.
    await waitFor(
      () => deliveries.a.length + deliveries.b.length === TOTAL_MESSAGES,
      {
        timeoutMs: DELIVERY_TIMEOUT_MS,
        intervalMs: 100,
        description:
          `all ${TOTAL_MESSAGES} messages delivered across both queues ` +
          `within the first rate-limit window`,
      },
    );

    // --- Per-queue counts -----------------------------------------------
    // Each queue received exactly its own limit, no more and no less.
    //
    // The "no more" half is what a per-queue limiter that ignored the
    // interval would produce — e.g. `limit: 4` meaning "4 ever, then
    // deliver everything" — and the "no less" half is what a shared
    // counter would produce on the smaller of the two queues.
    //
    // The two assertions together pin the observable contract:
    // independent windows, each honoring its own limit.
    expect(
      deliveries.a.length,
      `queue A received ${deliveries.a.length} deliveries; expected exactly ` +
        `${A_LIMIT.limit} (its first-window allowance)`,
    ).toBe(A_LIMIT.limit);

    expect(
      deliveries.b.length,
      `queue B received ${deliveries.b.length} deliveries; expected exactly ` +
        `${B_LIMIT.limit} (its first-window allowance)`,
    ).toBe(B_LIMIT.limit);

    // --- Same-window check ----------------------------------------------
    // Both queues' deliveries landed in the same wall-clock window.
    // The earliest delivery across either queue and the latest across
    // either queue must be within one interval of each other, or the
    // framework serialized the two queues' deliveries across windows —
    // the buggy behavior this test exists to catch.
    //
    // This is redundant with the waitFor's implicit check (the waitFor
    // could not have resolved if the total had been delivered across
    // two windows), but it produces a cleaner diagnostic on failure:
    // it names the actual span rather than timing out on the predicate.
    const allTimestamps = [...deliveries.a, ...deliveries.b].sort(
      (x, y) => x - y,
    );
    const span = allTimestamps[allTimestamps.length - 1] - allTimestamps[0];
    const intervalMs = A_LIMIT.interval;

    expect(
      span,
      `${TOTAL_MESSAGES} deliveries spanned ${span}ms; if the two queues' ` +
        `rate limits are independent, every delivery lands inside one ` +
        `${intervalMs}ms window, so the span must be < ${intervalMs}ms. ` +
        `A larger span means one queue's deliveries were held until the ` +
        `other queue's window rolled.`,
    ).toBeLessThan(intervalMs);

    // --- Post-state -----------------------------------------------------
    // Every message was acknowledged on its queue. The batch-ack timer
    // may not have flushed by the time the last delivery was recorded,
    // so the assertions poll.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    await waitFor(
      async () =>
        (await acknowledged.countMessages(queueA)) === A_LIMIT.limit &&
        (await acknowledged.countMessages(queueB)) === B_LIMIT.limit,
      {
        timeoutMs: 5000,
        description: 'both queues drained to the acknowledged state',
      },
    );

    expect(await acknowledged.countMessages(queueA)).toBe(A_LIMIT.limit);
    expect(await acknowledged.countMessages(queueB)).toBe(B_LIMIT.limit);

    // Both pending lists are empty — delivery was a move, not a copy.
    expect(await pending.countMessages(queueA)).toBe(0);
    expect(await pending.countMessages(queueB)).toBe(0);

    await consumer.shutdown();
  });
});
