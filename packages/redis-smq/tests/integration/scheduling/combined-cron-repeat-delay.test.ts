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
 * Integration tests for combined DELAY + CRON + REPEAT scheduling.
 *
 * A message produced with all three scheduling parameters combines the
 * behaviors of the two-parameter combinations:
 *
 *   - DELAY gives one firing after `D` ms, regardless of CRON.
 *   - After that, CRON + REPEAT takes over — the CRON bounds the
 *     cycles, the repeat count is the inner burst per cycle.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Delay before the first firing.
 *
 * 3000ms is short enough to keep the test under 30 seconds, long enough
 * that the delay is clearly a delay rather than a fast-firing CRON.
 */
const DELAY_MS = 3000;

/**
 * CRON expression firing every 6 seconds. `x/6` divides 60 evenly, so
 * every CRON-to-CRON interval is uniform — see the file header.
 */
const CRON_EXPRESSION = '*/6 * * * * *';

/** Interval between CRON firings, in milliseconds. */
const CRON_INTERVAL_MS = 6000;

/** Number of repeats between consecutive CRON firings. */
const REPEAT_COUNT = 2;

/** Interval between consecutive repeats, in milliseconds. */
const REPEAT_PERIOD_MS = 1000;

/**
 * Residual gap between the last repeat of a cycle and the next CRON.
 */
const GAP_AFTER_REPEATS_MS = CRON_INTERVAL_MS - REPEAT_COUNT * REPEAT_PERIOD_MS;

/**
 * Firings to wait for: one delay firing plus one full CRON cycle plus
 * the start of the second cycle. Eight gives six predictable gaps after
 * the phase-dependent first one — enough to see the pattern twice and
 * confirm the reset.
 */
const TARGET_FIRINGS = 8;

/**
 * Tolerance for the first firing's offset from produce.
 *
 * Larger than the gap tolerance because the delay firing's timing is
 * subject to the worker's tick alignment: the worker picks up the
 * message on the first tick at or after `T + D`, so the observed offset
 * is `D + tickLatency`. 3000ms allows for a tick interval up to three
 * seconds.
 */
const TOLERANCE_FIRST_FIRING_MS = 3000;

/**
 * Tolerance for the gap assertions after the delay firing.
 *
 * A gap is either `P` or `C - N*P`. With `P = 1000` and `C - N*P =
 * 4000`, the two ranges `[0, 2000]` and `[3000, 5000]` are disjoint —
 * no ambiguity about which type a failing gap belonged to. 1000ms is
 * comfortably larger than the worker's tick latency and well within the
 * 3000ms separation between the two gap types.
 */
const TOLERANCE_GAP_MS = 1000;

/**
 * Expected gaps between consecutive firings, starting from gap 1
 * (firing 2 → firing 3). Gap 0 (firing 1 → firing 2) is the
 * phase-dependent δ and is not asserted.
 */
const EXPECTED_GAPS_AFTER_DELAY: readonly number[] = [
  REPEAT_PERIOD_MS, // firing 2 → 3 (first repeat of cycle 1)
  REPEAT_PERIOD_MS, // firing 3 → 4 (second repeat of cycle 1)
  GAP_AFTER_REPEATS_MS, // firing 4 → 5 (residual to next CRON)
  REPEAT_PERIOD_MS, // firing 5 → 6 (first repeat of cycle 2)
  REPEAT_PERIOD_MS, // firing 6 → 7 (second repeat of cycle 2)
  GAP_AFTER_REPEATS_MS, // firing 7 → 8 (residual to next CRON)
];

/** Human-readable labels for the gap assertions' failure messages. */
const GAP_LABELS: readonly string[] = [
  'repeat 1 of cycle 1',
  'repeat 2 of cycle 1',
  'cycle 1 → cycle 2 (CRON reset)',
  'repeat 1 of cycle 2',
  'repeat 2 of cycle 2',
  'cycle 2 → cycle 3 (CRON reset)',
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Scheduling with DELAY + CRON + REPEAT', () => {
  it('applies the delay once, then alternates CRON cycles and repeats', async () => {
    const queue = uniqueQueue('sched-delay-cron-repeat');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const producedAt = Date.now();
    const [originalId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('delay-cron-repeat')
        .setScheduledDelay(DELAY_MS)
        .setScheduledCRON(CRON_EXPRESSION)
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
      async () => (await pending.countMessages(queue)) >= TARGET_FIRINGS,
      {
        // Worst case: delay (3s) + δ (up to 6s) + one CRON cycle (6s) +
        // 2 repeats (2s) + a partial second cycle. Roughly 20–25s.
        // 45s accommodates a slow CI.
        timeoutMs: 45_000,
        intervalMs: 200,
        description: `at least ${TARGET_FIRINGS} DELAY+CRON+REPEAT firings reached the pending list`,
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

    // Exactly the expected number of firings.
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

    // The first firing is the delay firing. Its offset from produce is
    // approximately DELAY_MS, plus at most one worker tick of latency.
    const firstFiringOffset = sorted[0].messageState.publishedAt! - producedAt;

    expect(
      firstFiringOffset,
      `first firing was ${firstFiringOffset}ms after produce, ` +
        `expected at least ${DELAY_MS}ms (the configured delay)`,
    ).toBeGreaterThanOrEqual(DELAY_MS);

    expect(
      firstFiringOffset,
      `first firing was ${firstFiringOffset}ms after produce, ` +
        `expected at most ${DELAY_MS + TOLERANCE_FIRST_FIRING_MS}ms ` +
        `(delay + max tick latency)`,
    ).toBeLessThanOrEqual(DELAY_MS + TOLERANCE_FIRST_FIRING_MS);

    // Compute the gaps between consecutive firings.
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1].messageState.publishedAt!;
      const curr = sorted[i].messageState.publishedAt!;
      gaps.push(curr - prev);
    }

    // The first gap is δ — the phase-dependent interval between the
    // delay firing and the next CRON boundary. It is not asserted.
    // Every subsequent gap follows the CRON + REPEAT pattern.
    for (let i = 1; i < gaps.length; i += 1) {
      const actual = gaps[i];
      const expected = EXPECTED_GAPS_AFTER_DELAY[i - 1];
      const label = GAP_LABELS[i - 1];

      expect(
        actual,
        `gap ${i} (${label}): expected ~${expected}ms ` +
          `±${TOLERANCE_GAP_MS}ms, got ${actual}ms`,
      ).toBeGreaterThanOrEqual(expected - TOLERANCE_GAP_MS);

      expect(
        actual,
        `gap ${i} (${label}): expected ~${expected}ms ` +
          `±${TOLERANCE_GAP_MS}ms, got ${actual}ms`,
      ).toBeLessThanOrEqual(expected + TOLERANCE_GAP_MS);
    }

    // All firing IDs are distinct. A regression that reused an ID
    // across firings would collide in Redis and the count above would
    // be misleading.
    const ids = sorted.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);

    // Every firing is a copy of the original — the original never
    // leaves the scheduled list, because the delay firing is also
    // treated as a "repeating" firing and reschedules the original.
    for (const msg of sorted) {
      expect(
        msg.messageState.scheduledMessageParentId,
        `firing ${msg.id} does not carry a parent pointer to the original`,
      ).toBe(originalId);
    }

    // The original itself is not among the pending firings.
    expect(ids).not.toContain(originalId);

    // The original is still in the scheduled list with status SCHEDULED.
    // This is the CRON behavior: the original is reserved for future
    // firings and is never consumed.
    expect(await scheduled.countMessages(queue)).toBe(1);

    const originalStatus =
      await RedisSMQ.createMessageManager().getMessageStatus(originalId);
    expect(originalStatus).toBe(EMessagePropertyStatus.SCHEDULED);
  });
});
