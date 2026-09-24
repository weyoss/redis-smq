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
import { findById } from '../../helpers/assertions/find-by-id.js';

/**
 * Integration tests for the `setScheduledRepeat` parameter.
 *
 * A message produced with `.setScheduledRepeat(N)` and
 * `.setScheduledRepeatPeriod(ms)` fires N times, with `ms` between
 * consecutive firings. Each firing produces one message in the pending
 * list. Unlike CRON scheduling — where the original stays scheduled
 * indefinitely and each fire produces a new pending message — a repeat
 * message has a bounded lifetime:
 *
 *   - The first N-1 firings produce new messages. Those messages carry
 *     a `scheduledMessageParentId` pointing at the original.
 *
 *   - The Nth firing *moves the original* to the pending list. After
 *     this, the scheduled list is empty for that message.
 *
 * The distinction matters for callers: a CRON message's original is
 * permanently reserved, while a repeat message's original becomes a
 * normal pending message once its schedule is exhausted.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The repeat count used by the primary test.
 *
 * Three gives two gaps to check — enough to detect a systematic
 * doubling or halving of the period without making the test slow.
 */
const REPEAT_COUNT = 3;

/**
 * The period between firings.
 *
 * 3000ms is longer than the worker's tick interval (which is on the
 * order of 1–2 seconds), so each firing is processed in its own tick
 * and the gap stays close to the configured period. A shorter period
 * — say 500ms — would be dominated by tick jitter and the assertion
 * would have no signal.
 */
const REPEAT_PERIOD_MS = 3000;

/**
 * Upper bound on the worker's tick jitter — the amount by which the
 * actual gap can exceed the configured period.
 *
 * The worker schedules the next firing at `now + period`, and the
 * framework's timer picks it up on its next tick. The excess over the
 * period is therefore at most one tick interval. 5000ms is a generous
 * bound that tolerates a slow worker without letting a doubled period
 * (6000ms over) pass.
 */
const MAX_TICK_JITTER_MS = 5000;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Scheduling with a repeat count', () => {
  it('fires exactly the configured number of times at the configured period', async () => {
    const queue = uniqueQueue('sched-repeat');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const [originalId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('repeat-body')
        .setScheduledRepeat(REPEAT_COUNT)
        .setScheduledRepeatPeriod(REPEAT_PERIOD_MS),
    );

    // Pre-state: the original is scheduled, nothing pending. No worker
    // is running, so nothing can have fired yet.
    const scheduled = RedisSMQ.createQueueScheduledMessages();
    expect(await scheduled.countMessages(queue)).toBe(1);

    const pending = RedisSMQ.createQueuePendingMessages();
    expect(await pending.countMessages(queue)).toBe(0);

    // Start the worker and wait for all firings.
    await startScheduleWorker(queue);

    await waitFor(
      async () => (await pending.countMessages(queue)) >= REPEAT_COUNT,
      {
        // The last firing needs (N - 1) * period of wall time, plus
        // two tick intervals of slack for the initial and final
        // pickups. That's 6000ms of periods plus ~4000ms of jitter for
        // a total around 10s; 20s is comfortable.
        timeoutMs: 20_000,
        intervalMs: 100,
        description: `at least ${REPEAT_COUNT} repeat firings reached the pending list`,
      },
    );

    // Read the pending messages and sort by publish time. RedisSMQ
    // processes firings in order, but storage order isn't guaranteed,
    // so sorting before comparison is necessary for the gap check.
    const page = await pending.getMessages(queue, 0, 100);
    const sorted = [...page.items].sort((a, b) => {
      const ta = a.messageState.publishedAt ?? 0;
      const tb = b.messageState.publishedAt ?? 0;
      return ta - tb;
    });

    // Exactly N firings. A regression that fired N+1 or N-1 times
    // would produce a different count here. The extra slack in the
    // waitFor above (which accepts >= N) is deliberate: if the
    // framework fires an extra time, this exact-count assertion is
    // where the failure lands, with a clearer message than a waitFor
    // predicate that could never be satisfied.
    expect(sorted).toHaveLength(REPEAT_COUNT);

    // Every firing has a real `publishedAt`. A missing timestamp would
    // make the gap comparisons below compare `undefined` and the
    // assertions would pass for the wrong reason.
    for (let i = 0; i < sorted.length; i += 1) {
      expect(
        typeof sorted[i].messageState.publishedAt,
        `firing ${i} has no publishedAt`,
      ).toBe('number');
      expect(sorted[i].messageState.publishedAt).toBeGreaterThan(0);
    }

    // Consecutive gaps are approximately the period. The gap must be
    // at least the period — RedisSMQ schedules the next fire at
    // `now + period` and does not fire early — and at most the period
    // plus one tick interval.
    for (let i = 1; i < sorted.length; i += 1) {
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
          `exceeds the configured period plus the max tick jitter ` +
          `(${REPEAT_PERIOD_MS + MAX_TICK_JITTER_MS}ms)`,
      ).toBeLessThanOrEqual(REPEAT_PERIOD_MS + MAX_TICK_JITTER_MS);
    }

    // The original message is among the firings — specifically it is
    // the final firing, since RedisSMQ moves it to pending when
    // the repeat count is exhausted rather than creating a new
    // message. Asserting presence first gives a clearer failure if the
    // original was lost than asserting on its position would.
    expect(sorted.map((m) => m.id)).toContain(originalId);

    // All firing IDs are distinct. A bug that reused one ID for
    // multiple firings would collide in Redis and the count above
    // would be misleading, so the distinctness check is worth pinning
    // separately.
    const ids = sorted.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);

    // The intermediate firings carry a parent pointer to the original.
    // The final firing — the original itself — does not, because it has
    // no parent (it is the parent).
    const nonOriginal = sorted.filter((m) => m.id !== originalId);
    expect(nonOriginal).toHaveLength(REPEAT_COUNT - 1);
    for (const msg of nonOriginal) {
      expect(msg.messageState.scheduledMessageParentId).toBe(originalId);
    }

    // The scheduled list is empty — the original was consumed by the
    // last firing. This is the key distinction from CRON scheduling,
    // where the original stays scheduled indefinitely.
    expect(await scheduled.countMessages(queue)).toBe(0);

    // The aggregate view agrees: nothing scheduled, N pending.
    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const counts = await queueMessages.countMessagesByStatus(queue);
    expect(counts).toEqual({
      pending: REPEAT_COUNT,
      acknowledged: 0,
      deadLettered: 0,
      scheduled: 0,
    });
  });

  it('consumes the original after a single repeat cycle when scheduledRepeat is 1', async () => {
    const queue = uniqueQueue('sched-repeat-one');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const [originalId] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody('repeat-once')
        .setScheduledRepeat(1)
        .setScheduledRepeatPeriod(REPEAT_PERIOD_MS),
    );

    await startScheduleWorker(queue);

    await waitFor(
      async () =>
        (await RedisSMQ.createQueuePendingMessages().countMessages(queue)) >= 1,
      {
        timeoutMs: 10_000,
        intervalMs: 100,
        description: 'the single repeat firing reached the pending list',
      },
    );

    // Give the worker a moment to (incorrectly) produce a second
    // firing, if it were going to. The period is 3s, so a spurious
    // second fire would land within this window.
    await new Promise((resolve) =>
      setTimeout(resolve, REPEAT_PERIOD_MS + MAX_TICK_JITTER_MS),
    );

    const pending = RedisSMQ.createQueuePendingMessages();
    const page = await pending.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);

    // The single pending message is the original — not a copy.
    const pendingMessage = findById(page.items, originalId);
    expect(pendingMessage.id).toBe(originalId);

    // The scheduled list is empty.
    const scheduled = RedisSMQ.createQueueScheduledMessages();
    expect(await scheduled.countMessages(queue)).toBe(0);
  });
});
