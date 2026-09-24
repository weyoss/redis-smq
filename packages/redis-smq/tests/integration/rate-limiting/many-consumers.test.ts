/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EQueueType,
  type IMessageTransferable,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import {
  DEFAULT_TIME_TOLERANCE_MS,
  expectGapNear,
} from '../../helpers/assertions/time.js';

/**
 * Integration tests for rate-limit enforcement across many consumers
 * attached to the same queue.
 *
 * RedisSMQ's rate limit is a property of the *queue*, not of any
 * individual consumer. When N consumers are registered on a single
 * rate-limited queue, they do not each get to check out `limit`
 * messages per `interval` — they collectively get to check out `limit`
 * per `interval`, distributed however the checkout race happens to
 * distribute them.
 *
 * This is the contract that distinguishes a queue-scoped limiter from
 * a per-consumer limiter, and it is the only thing this file tests.
 * The single-consumer variants (`fifo.test.ts`, `priority.test.ts`)
 * cannot distinguish the two: with one consumer, "per-queue" and "per-
 * consumer" produce identical observations.
 *
 * WHY THE DISTINCTION MATTERS IN PRACTICE:
 *
 *   A rate limit exists to bound the aggregate work a downstream
 *   system is asked to do — a third-party API with a per-minute quota,
 *   a database with a connection cap, a service that degrades under
 *   load. The bound is meaningful only if it applies to the *set* of
 *   consumers attached to the queue.
 *
 *   If the limiter were per-consumer, a caller who scaled up consumer
 *   count to improve latency would silently increase the aggregate
 *   rate — exactly the opposite of what a rate limit is for. This test
 *   pins the queue-scoped behavior so a refactor that moved the
 *   limiter into the per-consumer checkout path would fail loudly.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The rate limit configuration under test.
 *
 * Same values as `fifo.test.ts` and `priority.test.ts` for direct
 * comparability — a reader who has opened all three sees the same
 * numbers and knows the assertions mean the same thing.
 */
const RATE_LIMIT = { limit: 3, interval: 10_000 } as const;

/**
 * Number of consumers attached to the queue.
 *
 * Six is strictly greater than `RATE_LIMIT.limit`, which is the
 * minimum for a per-consumer bug to produce an unmistakably different
 * first-window count. It also matches the original `test00031`'s
 * consumer count.
 */
const NUM_CONSUMERS = 6;

/**
 * Number of deliveries to observe before asserting.
 *
 * `limit * 2` is the minimum to observe both a full first batch and the
 * window rollover into a second batch. Observing more would extend the
 * test without adding a distinct signal.
 */
const OBSERVED_DELIVERIES = RATE_LIMIT.limit * 2;

/**
 * Total messages produced.
 *
 * `OBSERVED_DELIVERIES` plus a small buffer, so the consumer fleet
 * never runs dry while the assertions are being observed. The buffer
 * is deliberately larger than `NUM_CONSUMERS` so that even if a
 * consumer is briefly idle it has work to pick up on the next window.
 */
const MESSAGES_TO_PRODUCE = OBSERVED_DELIVERIES + NUM_CONSUMERS;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Rate limiting — many consumers', () => {
  it('enforces the limit at the queue level, not per consumer', async () => {
    const queue = uniqueQueue('rl-many');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Set the limit. As in the sibling files, the pre-state `get`
    // guards against a silent setup failure that would leave the queue
    // unlimited — in which case all the timing assertions below would
    // fail in a confusing way rather than pointing at the missing
    // limit.
    const rateLimit = RedisSMQ.createQueueRateLimitManager();
    await rateLimit.set(queue, RATE_LIMIT);
    expect(await rateLimit.get(queue)).toEqual(RATE_LIMIT);

    // Produce more messages than the fleet will consume, so the
    // consumers never run dry mid-observation. A consumer fleet that
    // emptied the queue would idle until the next test-phase, and the
    // gap pattern would be dominated by the idleness rather than by
    // the rate limiter.
    const producer = await startProducer();
    for (let i = 0; i < MESSAGES_TO_PRODUCE; i += 1) {
      await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody(`msg-${i}`),
      );
    }

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(MESSAGES_TO_PRODUCE);

    // Create N consumers, all with the same timestamp-capturing
    // handler. `Promise.all` runs the creations concurrently — each
    // is independent and there is no ordering dependency between
    // them.
    //
    // The handler is where the delivery timestamp is captured: the
    // handler is invoked at delivery time, which is exactly the moment
    // the rate limiter controls. See `fifo.test.ts` for the reasoning
    // on why the handler is preferred over the ack event.
    const timestamps: number[] = [];
    const consumers = await Promise.all(
      Array.from({ length: NUM_CONSUMERS }, () =>
        getConsumer({
          queue,
          messageHandler: (_msg: IMessageTransferable, cb: ICallback) => {
            timestamps.push(Date.now());
            cb();
          },
        }),
      ),
    );

    // Run all consumers. Their polls are concurrent — the checkout
    // script is RedisSMQ's serialization point, so the exact
    // interleaving of the consumers' poll calls is not observable.
    await Promise.all(consumers.map((c) => c.run()));

    // Wait for the observation count. The (limit*2)th delivery lands
    // after the second rate-limit window opens, so the timeout is
    // generous — the interval plus slack for the poll-and-ack tail.
    await waitFor(() => timestamps.length >= OBSERVED_DELIVERIES, {
      timeoutMs: RATE_LIMIT.interval * 3,
      intervalMs: 100,
      description: `${OBSERVED_DELIVERIES} deliveries across ${NUM_CONSUMERS} consumers`,
    });

    // Sort and slice. `timestamps` is written concurrently by N
    // handlers, so the array order is not the delivery order — the
    // sort recovers it. The slice discards any deliveries that landed
    // between the waitFor's predicate becoming true and the read of
    // `timestamps`, which would otherwise make the gap indices
    // ambiguous.
    const sorted = [...timestamps]
      .sort((a, b) => a - b)
      .slice(0, OBSERVED_DELIVERIES);

    const gaps = sorted.slice(1).map((ts, i) => ts - sorted[i]);

    expect(gaps).toHaveLength(OBSERVED_DELIVERIES - 1);

    // --- Individual gap assertions --------------------------------------
    // Under correct queue-scoped enforcement, the pattern is:
    //
    //   gap 0: within batch 1 (near-zero)
    //   gap 1: within batch 1 (near-zero)
    //   gap 2: window rollover (≈ interval)
    //   gap 3: within batch 2 (near-zero)
    //   gap 4: within batch 2 (near-zero)
    //
    // Under a per-consumer bug, the first six deliveries all land in
    // the first window: every gap is near-zero, and gap 2 fails the
    // lower bound of the interval assertion.
    expectGapNear(gaps[0], 0, 'gap 1 (within batch 1)');
    expectGapNear(gaps[1], 0, 'gap 2 (within batch 1)');

    expectGapNear(
      gaps[2],
      RATE_LIMIT.interval,
      'gap 3 (window rollover, batch 1 → batch 2)',
    );

    expectGapNear(gaps[3], 0, 'gap 4 (within batch 2)');
    expectGapNear(gaps[4], 0, 'gap 5 (within batch 2)');

    // --- Aggregate span assertion ---------------------------------------
    // Independent confirmation that the aggregate rate was bounded.
    //
    // Under correct queue-scoped enforcement, the first and last
    // observed deliveries are in different windows, so the span is at
    // least one interval. Under a per-consumer bug, all six deliveries
    // land in the first window and the span is a few milliseconds.
    //
    // This assertion is redundant with gap 2's, but it is robust to a
    // different failure mode: if RedisSMQ distributed the
    // rollover across two or three smaller pauses rather than one
    // large one (each individual gap failing the "near-interval"
    // check but the total still being right), gap 2 would fail while
    // this assertion would still hold. That distinction tells a
    // future debugger whether the *total* enforcement broke or only
    // its per-gap distribution.
    const totalSpan = sorted[sorted.length - 1] - sorted[0];
    expect(
      totalSpan,
      `${OBSERVED_DELIVERIES} deliveries across ${NUM_CONSUMERS} consumers ` +
        `spanned ${totalSpan}ms; expected ≥ ` +
        `${RATE_LIMIT.interval - DEFAULT_TIME_TOLERANCE_MS}ms if the rate limit ` +
        `is queue-scoped`,
    ).toBeGreaterThanOrEqual(RATE_LIMIT.interval - DEFAULT_TIME_TOLERANCE_MS);

    // --- Every gap is one of the two expected kinds ---------------------
    // A "partial enforcement" bug — say, four deliveries in the first
    // window instead of three, because the limiter happened to let one
    // extra through — would still produce a single large gap
    // somewhere in the sequence, but the individual-gap assertions
    // above only check specific indices. This loop checks every gap,
    // so an unexpected value at an index the earlier assertions did
    // not cover is still caught.
    for (let i = 0; i < gaps.length; i += 1) {
      const gap = gaps[i];
      const isWithinBatch = Math.abs(gap) <= DEFAULT_TIME_TOLERANCE_MS;
      const isRollover =
        Math.abs(gap - RATE_LIMIT.interval) <= DEFAULT_TIME_TOLERANCE_MS;

      expect(
        isWithinBatch || isRollover,
        `gap ${i} (${gap}ms) is neither near-zero nor near ` +
          `${RATE_LIMIT.interval}ms — a delivery landed outside the ` +
          `expected batch boundaries`,
      ).toBe(true);
    }

    // Shut down the fleet explicitly
    await Promise.all(consumers.map((c) => c.shutdown()));
  });
});
