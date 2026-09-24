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
import bluebird from 'bluebird';

/**
 * Integration tests for the `setScheduledCRON` parameter.
 *
 * A message produced with `.setScheduledCRON(expr)` lands in the
 * scheduled list with a score equal to the next time matching the
 * expression. On each worker tick where the score is in the past, the
 * framework:
 *
 *   1. Creates a *new* message with the same body and properties.
 *   2. Enqueues that new message to the pending list.
 *   3. Updates the original's score to the *next* CRON time.
 *
 * The original therefore stays in the scheduled list indefinitely — or
 * until something deletes it — while each firing produces one new
 * pending message. This is the key distinction from `delay.test.ts`,
 * where a single firing removes the message from the scheduled list
 * entirely.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * CRON expression used by the tests.
 *
 * The CRON_EXPRESSION fires at seconds 0, 3, 6, 9, ... of every minute.
 * The 6-field form includes seconds, which is what RedisSMQ
 * accepts (5-field expressions are also accepted and are converted by
 * prefixing a `0` seconds field, but the explicit 6-field form is
 * clearer about what's being tested).
 *
 * 3 seconds is a compromise: short enough that the test completes
 * quickly, long enough that the worker tick can process each firing
 * individually. See the file header for why this assumes a sub-3-second
 * tick interval.
 */
const CRON_EXPRESSION = '*/3 * * * * *';

/**
 * The interval between CRON firings, in milliseconds. Derived from the
 * expression above — keep the two in sync if either changes.
 */
const CRON_INTERVAL_MS = 3000;

/**
 * Tolerance for the interval assertion. See the file header for the
 * rationale and the bounds it has to satisfy.
 */
const TIMING_TOLERANCE_MS = 2000;

/**
 * Number of pending messages the test waits for before checking
 * intervals.
 *
 * Three firings give two intervals to check, which is the minimum to
 * detect a systematic doubling or halving of the CRON interval. Two
 * firings would give a single interval, which could pass by accident if
 * RedisSMQ's own start-up latency happened to align with the
 * expected duration.
 */
const TARGET_FIRINGS = 3;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Scheduling with a CRON expression', () => {
  it('fires repeatedly at the CRON interval and keeps the original scheduled', async () => {
    const queue = uniqueQueue('sched-cron');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const [originalId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('cron-body')
        .setScheduledCRON(CRON_EXPRESSION),
    );

    // Pre-state: the original is scheduled, nothing pending. With no
    // worker running, the message cannot have fired yet.
    const scheduled = RedisSMQ.createQueueScheduledMessages();
    expect(await scheduled.countMessages(queue)).toBe(1);

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    // Start the worker and wait for enough firings to observe intervals.
    await startScheduleWorker(queue);

    await waitFor(
      async () => (await pending.countMessages(queue)) >= TARGET_FIRINGS,
      {
        timeoutMs: 20_000,
        intervalMs: 100,
        description: `at least ${TARGET_FIRINGS} CRON firings reached the pending list`,
      },
    );

    // Read the pending messages and sort by publish time. RedisSMQ
    // processes firings in the order it observes them, but the storage
    // order isn't guaranteed to match, so sorting before comparison is
    // necessary.
    const page = await pending.getMessages(queue, 0, 100);
    const sorted = [...page.items].sort((a, b) => {
      const ta = a.messageState.publishedAt ?? 0;
      const tb = b.messageState.publishedAt ?? 0;
      return ta - tb;
    });

    // Every pending message has a real `publishedAt`. A missing
    // timestamp would make the interval comparisons below compare
    // `undefined` values and the assertions would pass for the wrong
    // reason.
    for (const msg of sorted) {
      expect(typeof msg.messageState.publishedAt).toBe('number');
      expect(msg.messageState.publishedAt).toBeGreaterThan(0);
    }

    // Consecutive firings are approximately the CRON interval apart.
    // Checking consecutive diffs rather than cumulative diffs from the
    // first message keeps the failure message localized: it names the
    // specific pair that diverged rather than reporting a growing
    // error against the first message.
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = sorted[i - 1].messageState.publishedAt!;
      const curr = sorted[i].messageState.publishedAt!;
      const diff = curr - prev;

      expect(
        diff,
        `interval between firing ${i - 1} and firing ${i} ` +
          `(${diff}ms) is below the expected range ` +
          `[${CRON_INTERVAL_MS - TIMING_TOLERANCE_MS}, ${CRON_INTERVAL_MS + TIMING_TOLERANCE_MS}]ms`,
      ).toBeGreaterThanOrEqual(CRON_INTERVAL_MS - TIMING_TOLERANCE_MS);

      expect(
        diff,
        `interval between firing ${i - 1} and firing ${i} ` +
          `(${diff}ms) is above the expected range ` +
          `[${CRON_INTERVAL_MS - TIMING_TOLERANCE_MS}, ${CRON_INTERVAL_MS + TIMING_TOLERANCE_MS}]ms`,
      ).toBeLessThanOrEqual(CRON_INTERVAL_MS + TIMING_TOLERANCE_MS);
    }

    // Each firing produced a *new* message — the pending IDs are
    // distinct, and none of them is the original.
    const pendingIds = sorted.map((m) => m.id);
    const distinctPendingIds = new Set(pendingIds);
    expect(distinctPendingIds.size).toBe(pendingIds.length);
    expect(pendingIds).not.toContain(originalId);

    // The original is still in the scheduled list. RedisSMQ's
    // publish operation is a copy-then-reschedule, not a move, so a
    // CRON message is never consumed by its own firing.
    expect(await scheduled.countMessages(queue)).toBe(1);
    const scheduledPage = await scheduled.getMessages(queue, 0, 100);
    expect(scheduledPage.items).toHaveLength(1);
    expect(scheduledPage.items[0].id).toBe(originalId);

    // The original's status is still SCHEDULED, not PENDING or
    // ACKNOWLEDGED. This confirms RedisSMQ didn't accidentally
    // move it during one of the firings.
    const status =
      await RedisSMQ.createMessageManager().getMessageStatus(originalId);
    expect(status).toBe(EMessagePropertyStatus.SCHEDULED);
  });

  it('does not fire before the first CRON boundary arrives', async () => {
    const queue = uniqueQueue('sched-cron-negative');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    // `0 * * * * *` fires at the top of every minute — seconds 0.
    // The next firing is somewhere between 0 and 60 seconds away,
    // depending on the current wall-clock second.
    await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('top-of-minute')
        .setScheduledCRON('0 * * * * *'),
    );

    await startScheduleWorker(queue);

    // Settle window. Long enough for the worker to have run several
    // ticks; short enough that the top-of-minute boundary is only
    // crossed if the test started within the last few seconds of a
    // minute — a ~5% chance, and even then the assertion catches it as
    // a legitimate firing, not a bug.
    await bluebird.delay(3000);

    const pending = RedisSMQ.createQueuePendingMessages();

    // The assertion is conditional on not having crossed the boundary
    // during the wait. Checking the wall-clock second at the end
    // distinguishes "no firing yet" from "firing happened legitimately".
    const now = new Date();
    const nearTopOfMinute = now.getSeconds() <= 4;

    if (!nearTopOfMinute) {
      expect(
        await pending.countMessages(queue),
        'expected no CRON firing before the top-of-minute boundary',
      ).toBe(0);
    }
  });
});
