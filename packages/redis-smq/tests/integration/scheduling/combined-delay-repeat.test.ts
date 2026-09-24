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
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { startScheduleWorker } from '../../helpers/workers/schedule-worker.js';

/**
 * Integration tests for combined DELAY and REPEAT scheduling.
 *
 * A message produced with both a scheduled delay and a repeat count
 * fires once after the delay, then `N` times at the repeat period. The
 * total number of pending messages is `N + 1`: `N` copies created by
 * the worker plus the original, which is moved to pending when the
 * repeat count is exhausted.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Delay before the first firing. */
const DELAY_MS = 10_000;

/** Number of repeats after the initial firing. */
const REPEAT_COUNT = 3;

/** Interval between consecutive repeats. */
const REPEAT_PERIOD_MS = 3_000;

/**
 * Total expected firings: the delay firing plus `N` repeats.
 */
const TOTAL_FIRINGS = REPEAT_COUNT + 1;

/**
 * Tolerance for timing assertions.
 *
 * RedisSMQ reschedules a firing at `now + P`, and the worker picks
 * it up on the first tick at or after that timestamp. The observed gap
 * is therefore in `[P, P + tickInterval]`. RedisSMQ's tick
 * interval is not documented, but earlier scheduling tests observed a
 * few hundred milliseconds to ~1 second of latency. 3000ms covers that
 * comfortably while still being tight enough to distinguish `P = 3000`
 * from a doubled period.
 */
const TIMING_TOLERANCE_MS = 3_000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Scheduling with DELAY + REPEAT', () => {
  it('fires once after the delay, then repeats at the period, ending with the original', async () => {
    const queue = uniqueQueue('sched-delay-repeat');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const producedAt = Date.now();
    const [originalId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('delay-and-repeat')
        .setScheduledDelay(DELAY_MS)
        .setScheduledRepeat(REPEAT_COUNT)
        .setScheduledRepeatPeriod(REPEAT_PERIOD_MS),
    );

    // Pre-state: the original is scheduled, nothing pending.
    const scheduled = RedisSMQ.createQueueScheduledMessages();
    expect(await scheduled.countMessages(queue)).toBe(1);

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    await startScheduleWorker(queue);

    await waitFor(
      async () => (await pending.countMessages(queue)) >= TOTAL_FIRINGS,
      {
        // Expected wall time: D + tick + (N-1)*P = 10000 + ~1000 + 6000
        // ≈ 17 seconds. 30 seconds accommodates a slow CI and gives the
        // exact-count assertion below a chance to run rather than the
        // waitFor timing out.
        timeoutMs: 30_000,
        intervalMs: 200,
        description: `at least ${TOTAL_FIRINGS} DELAY+REPEAT firings reached the pending list`,
      },
    );

    // Sort by publish time. RedisSMQ processes firings in order,
    // but the paginated read from Redis doesn't guarantee that order.
    const page = await pending.getMessages(queue, 0, 100);
    const sorted = [...page.items].sort((a, b) => {
      const ta = a.messageState.publishedAt ?? 0;
      const tb = b.messageState.publishedAt ?? 0;
      return ta - tb;
    });

    // Exactly N+1 firings.
    expect(sorted).toHaveLength(TOTAL_FIRINGS);

    // Every firing has a real publishedAt.
    for (let i = 0; i < sorted.length; i += 1) {
      expect(
        typeof sorted[i].messageState.publishedAt,
        `firing ${i} has no publishedAt`,
      ).toBe('number');
      expect(sorted[i].messageState.publishedAt).toBeGreaterThan(0);
    }

    // The first firing is approximately DELAY_MS after produce. The
    // lower bound is the configured delay (RedisSMQ does not fire
    // early); the upper bound allows for one worker tick of latency.
    const firstFiringOffset = sorted[0].messageState.publishedAt! - producedAt;

    expect(
      firstFiringOffset,
      `first firing was ${firstFiringOffset}ms after produce, ` +
        `expected at least ${DELAY_MS}ms (the configured delay)`,
    ).toBeGreaterThanOrEqual(DELAY_MS);

    expect(
      firstFiringOffset,
      `first firing was ${firstFiringOffset}ms after produce, ` +
        `expected at most ${DELAY_MS + TIMING_TOLERANCE_MS}ms ` +
        `(delay + max tick latency)`,
    ).toBeLessThanOrEqual(DELAY_MS + TIMING_TOLERANCE_MS);

    // The gaps between firings 2→3 and 3→4 are the repeat period. The
    // gap 1→2 is the worker's initial tick latency and is not asserted
    // against a specific value — it depends on when the worker's timer
    // happens to align with the reschedule timestamp.
    for (let i = 2; i < sorted.length; i += 1) {
      const prev = sorted[i - 1].messageState.publishedAt!;
      const curr = sorted[i].messageState.publishedAt!;
      const gap = curr - prev;

      expect(
        gap,
        `gap between firing ${i - 1} and firing ${i} (${gap}ms) ` +
          `is below the configured period (${REPEAT_PERIOD_MS}ms)`,
      ).toBeGreaterThanOrEqual(REPEAT_PERIOD_MS);

      expect(
        gap,
        `gap between firing ${i - 1} and firing ${i} (${gap}ms) ` +
          `exceeds the configured period plus tolerance ` +
          `(${REPEAT_PERIOD_MS + TIMING_TOLERANCE_MS}ms)`,
      ).toBeLessThanOrEqual(REPEAT_PERIOD_MS + TIMING_TOLERANCE_MS);
    }

    // The original is among the firings — specifically, it is the last
    // one. RedisSMQ moves the original to pending when the repeat
    // counter reaches its limit; every earlier firing produced a copy.
    const ids = sorted.map((m) => m.id);
    expect(ids).toContain(originalId);
    expect(sorted[sorted.length - 1].id).toBe(originalId);

    // All firing IDs are distinct. A regression that reused an ID
    // across firings would collide in Redis and the count above would
    // be misleading.
    expect(new Set(ids).size).toBe(ids.length);

    // Exactly REPEAT_COUNT firings are copies — they carry a parent
    // pointer to the original. The remaining firing is the original
    // itself, which has no parent.
    const copies = sorted.filter(
      (m) => m.messageState.scheduledMessageParentId === originalId,
    );
    expect(copies).toHaveLength(REPEAT_COUNT);

    for (const copy of copies) {
      expect(copy.messageState.scheduledMessageParentId).toBe(originalId);
      expect(copy.id).not.toBe(originalId);
    }

    // The original is not among the copies.
    expect(copies.map((m) => m.id)).not.toContain(originalId);

    // The scheduled list is empty. The last firing moved the original
    // out of the scheduled storage.
    expect(await scheduled.countMessages(queue)).toBe(0);

    // The original's terminal status is PENDING, not still SCHEDULED.
    // This confirms RedisSMQ actually moved the message rather
    // than just removing it from the scheduled list.
    const status =
      await RedisSMQ.createMessageManager().getMessageStatus(originalId);
    expect(status).toBe(EMessagePropertyStatus.PENDING);
  });

  it('fires exactly once when scheduledRepeat is 0', async () => {
    // The boundary case: `setScheduledRepeat(0)` means "no repeats".
    // With just a delay and no repeat count, the message fires once
    // after the delay and the original itself is that firing — there
    // are no copies.
    //
    // This anchors the semantics of the delay firing at the boundary.
    // A bug that always created a copy for the delay firing would
    // produce two pending messages here (a copy plus the original
    // moving to pending), which would fail the count assertion.
    const queue = uniqueQueue('sched-delay-no-repeat');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const producedAt = Date.now();
    const [originalId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('delay-only')
        .setScheduledDelay(DELAY_MS)
        .setScheduledRepeat(0)
        .setScheduledRepeatPeriod(REPEAT_PERIOD_MS),
    );

    await startScheduleWorker(queue);

    await waitFor(
      async () =>
        (await RedisSMQ.createQueuePendingMessages().countMessages(queue)) >= 1,
      {
        timeoutMs: 20_000,
        intervalMs: 200,
        description: 'the single delayed firing reached the pending list',
      },
    );

    // Give the worker a moment to (incorrectly) produce a copy, if it
    // were going to. The repeat period is the shortest plausible gap
    // between a spurious copy and the original, so waiting past it
    // gives any such bug a chance to surface.
    await new Promise((resolve) =>
      setTimeout(resolve, REPEAT_PERIOD_MS + TIMING_TOLERANCE_MS),
    );

    const pending = RedisSMQ.createQueuePendingMessages();
    const page = await pending.getMessages(queue, 0, 100);

    // Exactly one firing.
    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);

    // And it is the original, not a copy.
    const firing = page.items[0];
    expect(firing.id).toBe(originalId);
    expect(firing.messageState.scheduledMessageParentId).toBeNull();

    // The first (and only) firing happened approximately DELAY_MS
    // after produce.
    const offset = firing.messageState.publishedAt! - producedAt;
    expect(offset).toBeGreaterThanOrEqual(DELAY_MS);
    expect(offset).toBeLessThanOrEqual(DELAY_MS + TIMING_TOLERANCE_MS);

    // The scheduled list is empty — the original was moved out.
    const scheduled = RedisSMQ.createQueueScheduledMessages();
    expect(await scheduled.countMessages(queue)).toBe(0);
  });
});
