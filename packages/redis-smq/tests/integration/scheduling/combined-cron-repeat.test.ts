/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EQueueType, RedisSMQ } from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { startScheduleWorker } from '../../helpers/workers/schedule-worker.js';

/**
 * Integration tests for combined CRON and REPEAT scheduling.
 *
 * When a message is produced with both a CRON expression and a repeat
 * count, RedisSMQ treats the CRON as the outer trigger and the
 * repeat as an inner cycle. The sequence is:
 *
 *     1. The CRON fires at its boundary.
 *     2. The repeat counter resets to 0.
 *     3. The message fires `N` times, `P` apart, from the CRON.
 *     4. The next CRON fires, resetting the counter again.
 *
 * The observable pattern of publish timestamps is therefore:
 *
 *     CRON, repeat×N, CRON, repeat×N, CRON, repeat×N, ...
 *
 * where each CRON is `C - N * P` after the last repeat of the previous
 * cycle. Choosing `C` and `P` so that `C - N * P` is materially
 * different from `P` makes the two firing types distinguishable by
 * their gaps alone.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * CRON expression firing every 6 seconds. The 6-field form includes
 * seconds; `x/6` matches seconds 0, 6, 12, 18, 24, 30, 36, 42, 48,
 * 54 of every minute.
 *
 * 6 divides 60 evenly, so every CRON-to-CRON gap is exactly 6 seconds
 * — the interval before the minute rolls over is not shorter than the
 * others. See the file header for why this matters.
 */
const CRON_EXPRESSION = '*/6 * * * * *';

/** Interval between CRON firings, in milliseconds. */
const CRON_INTERVAL_MS = 6000;

/** Number of repeats between consecutive CRON firings. */
const REPEAT_COUNT = 2;

/** Interval between consecutive repeats, in milliseconds. */
const REPEAT_PERIOD_MS = 1000;

/**
 * Gap between the last repeat of a cycle and the next CRON, in
 * milliseconds. Derived from the CRON interval and the repeat cycle.
 */
const GAP_AFTER_REPEATS_MS = CRON_INTERVAL_MS - REPEAT_COUNT * REPEAT_PERIOD_MS;

/**
 * Number of firings the test waits for. Two complete CRON cycles plus
 * the CRON that starts the third — enough to observe the reset behavior
 * twice.
 */
const TARGET_FIRINGS = 7;

/**
 * Tolerance for each gap assertion.
 *
 * The actual publish timestamp is stamped by the worker when it
 * processes the firing, so the observed gap includes the worker's tick
 * latency. On a quiet system that's a few hundred milliseconds; on CI
 * it can be more. 1000ms is comfortably larger than the expected
 * latency and comfortably smaller than the separation between the two
 * gap types (3000ms).
 */
const TIMING_TOLERANCE_MS = 1000;

/**
 * Expected gap sequence. Each entry is the gap between the i-th and
 * (i+1)-th firing, starting from the first CRON.
 *
 * The pattern is `[P, P, C - N*P]` repeated — two repeats followed by
 * the gap to the next CRON.
 */
const EXPECTED_GAPS: readonly number[] = [
  REPEAT_PERIOD_MS, // CRON → repeat 1
  REPEAT_PERIOD_MS, // repeat 1 → repeat 2
  GAP_AFTER_REPEATS_MS, // repeat 2 → next CRON
  REPEAT_PERIOD_MS, // next CRON → repeat 1
  REPEAT_PERIOD_MS, // repeat 1 → repeat 2
  GAP_AFTER_REPEATS_MS, // repeat 2 → third CRON
];

/**
 * Human-readable labels for each gap. Used in failure messages so a
 * failing assertion says which transition went wrong, not just which
 * index.
 */
const GAP_LABELS: readonly string[] = [
  'CRON → repeat 1 (cycle 1)',
  'repeat 1 → repeat 2 (cycle 1)',
  'repeat 2 → CRON (cycle 1 to 2)',
  'CRON → repeat 1 (cycle 2)',
  'repeat 1 → repeat 2 (cycle 2)',
  'repeat 2 → CRON (cycle 2 to 3)',
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Scheduling with CRON + REPEAT', () => {
  it('alternates CRON firings and repeat cycles, resetting the repeat counter on each CRON', async () => {
    const queue = uniqueQueue('sched-cron-repeat');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('cron-and-repeat')
        .setScheduledCRON(CRON_EXPRESSION)
        .setScheduledRepeat(REPEAT_COUNT)
        .setScheduledRepeatPeriod(REPEAT_PERIOD_MS),
    );

    // Pre-state: the original is scheduled, nothing pending. No worker
    // is running, so nothing can have fired yet.
    const scheduled = RedisSMQ.createQueueScheduledMessages();
    expect(await scheduled.countMessages(queue)).toBe(1);

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    await startScheduleWorker(queue);

    await waitFor(
      async () => (await pending.countMessages(queue)) >= TARGET_FIRINGS,
      {
        // The test needs to observe two full CRON cycles, so the minimum
        // wall time is `2 * CRON_INTERVAL_MS` from the first CRON —
        // roughly 12 seconds — plus the initial wait for the first CRON
        // boundary (up to 6 seconds) and worker latency. 30 seconds
        // accommodates all of it with slack for a slow CI.
        timeoutMs: 30_000,
        intervalMs: 200,
        description: `at least ${TARGET_FIRINGS} firings reached the pending list`,
      },
    );

    // Sort by publish timestamp. RedisSMQ processes firings in
    // order, but the paginated read from Redis does not guarantee that
    // order, so sorting before comparison is necessary for the gap
    // check.
    const page = await pending.getMessages(queue, 0, 100);
    const sorted = [...page.items].sort((a, b) => {
      const ta = a.messageState.publishedAt ?? 0;
      const tb = b.messageState.publishedAt ?? 0;
      return ta - tb;
    });

    // Exactly the expected number of firings. A regression that
    // produced fewer would have failed the waitFor above; a regression
    // that produced more would fail here, with a clearer message than
    // a waitFor predicate that could never be satisfied.
    expect(sorted).toHaveLength(TARGET_FIRINGS);

    // Every firing has a real publishedAt. A missing timestamp would
    // make the gap comparisons below compare `undefined` values and the
    // assertions would pass for the wrong reason.
    for (let i = 0; i < sorted.length; i += 1) {
      expect(
        typeof sorted[i].messageState.publishedAt,
        `firing ${i} has no publishedAt`,
      ).toBe('number');
      expect(sorted[i].messageState.publishedAt).toBeGreaterThan(0);
    }

    // Compute the gaps between consecutive firings.
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1].messageState.publishedAt!;
      const curr = sorted[i].messageState.publishedAt!;
      gaps.push(curr - prev);
    }

    expect(gaps).toHaveLength(EXPECTED_GAPS.length);

    // Assert each gap is within tolerance of its expected value. The
    // assertion is per-index rather than a bulk `toEqual` so a failure
    // names which transition diverged.
    for (let i = 0; i < gaps.length; i += 1) {
      const actual = gaps[i];
      const expected = EXPECTED_GAPS[i];
      const label = GAP_LABELS[i];

      expect(
        actual,
        `gap ${i + 1} (${label}): expected ~${expected}ms ` +
          `±${TIMING_TOLERANCE_MS}ms, got ${actual}ms`,
      ).toBeGreaterThanOrEqual(expected - TIMING_TOLERANCE_MS);

      expect(
        actual,
        `gap ${i + 1} (${label}): expected ~${expected}ms ` +
          `±${TIMING_TOLERANCE_MS}ms, got ${actual}ms`,
      ).toBeLessThanOrEqual(expected + TIMING_TOLERANCE_MS);
    }

    // The original message stays in the scheduled list. For CRON +
    // REPEAT combinations, every firing produces a new pending message
    // and the original is rescheduled to the next boundary. The
    // original is never moved to pending.
    expect(await scheduled.countMessages(queue)).toBe(1);
    const scheduledPage = await scheduled.getMessages(queue, 0, 100);
    expect(scheduledPage.items).toHaveLength(1);

    // The gap pattern is the evidence that the reset happened. Without
    // the reset, cycle 2 would show a single large gap (the full CRON
    // interval) instead of the two repeats followed by a shorter gap.
    // The specific gaps `[P, P, C - N*P]` appearing twice is that
    // evidence.
    expect(gaps[0]).toBeLessThan(gaps[2]);
    expect(gaps[1]).toBeLessThan(gaps[2]);
    expect(gaps[3]).toBeLessThan(gaps[5]);
    expect(gaps[4]).toBeLessThan(gaps[5]);
  });
});
