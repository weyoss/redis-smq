/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EQueueType, type IQueueParams, RedisSMQ } from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for the scheduled-message state.
 *
 * A message produced with one of the scheduling parameters —
 * `setScheduledDelay`, `setScheduledCRON`, `setScheduledRepeat` (with
 * its period) — does not go into the pending list. It goes into the
 * scheduled list (`keyQueueScheduled`), where it waits for a
 * `PublishScheduledWorker` to move it to pending once its schedule
 * fires.
 *
 * This file establishes the *state* contract: what the scheduled list
 * looks like after producing a scheduled message, and what the pending
 * list does not look like. The timing contract — when the message
 * actually moves — is the subject of `delay.test.ts`, `cron.test.ts`,
 * and `repeat.test.ts`.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Delay used by the delay-scheduled test.
 *
 * Any value works — the message never fires because no worker runs.
 * 60 seconds is well beyond any test duration, so the message is
 * unambiguously in the scheduled state for the entire test.
 */
const SCHEDULED_DELAY_MS = 60_000;

/**
 * CRON expression used by the CRON-scheduled test.
 *
 * Every minute. As with the delay, the schedule never fires because no
 * worker runs; the value only needs to be a valid expression that the
 * producer accepts.
 */
const SCHEDULED_CRON = '0 * * * * *';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce a message with the given scheduling configuration.
 *
 * `configure` receives the producible message so each test can set the
 * parameters it cares about without the helper having to know which
 * variant it's being called with.
 */
async function produceScheduledMessage(
  queue: IQueueParams,
  configure: (msg: ReturnType<typeof RedisSMQ.newProducibleMessage>) => void,
): Promise<string> {
  const producer = await startProducer();
  const msg = RedisSMQ.newProducibleMessage().setQueue(queue);
  configure(msg);
  const [id] = await producer.produce(msg);
  return id;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Scheduling a message', () => {
  // -------------------------------------------------------------------------
  // Delay
  // -------------------------------------------------------------------------

  describe('with a delay', () => {
    it('places the message in the scheduled list with the correct state', async () => {
      const queue = uniqueQueue('sched-delay');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const id = await produceScheduledMessage(queue, (msg) => {
        msg.setScheduledDelay(SCHEDULED_DELAY_MS).setBody('delayed');
      });

      const scheduled = RedisSMQ.createQueueScheduledMessages();

      // The scheduled list contains exactly one message, and it is the
      // one that was produced. This is the primary assertion: the
      // message was routed to the scheduled storage, not to pending.
      const page = await scheduled.getMessages(queue, 0, 100);
      expect(page.totalItems).toBe(1);
      expect(page.items).toHaveLength(1);
      expect(page.items[0].id).toBe(id);

      // The count accessor agrees with the paginated read. Both paths
      // go through the same storage, so a divergence here would point
      // at one of the two accessors rather than the state.
      expect(await scheduled.countMessages(queue)).toBe(1);

      // The message carries a populated scheduling state. The precise
      // fields RedisSMQ writes depend on the parameter variant,
      // but the presence of a numeric `scheduledAt` is common to all
      // three and is the earliest signal that RedisSMQ recorded
      // the schedule.
      const message = page.items[0];
      expect(message.destinationQueue).toEqual(queue);
      expect(message.messageState).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // CRON
  // -------------------------------------------------------------------------

  describe('with a CRON expression', () => {
    it('places the message in the scheduled list', async () => {
      const queue = uniqueQueue('sched-cron');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const id = await produceScheduledMessage(queue, (msg) => {
        msg.setScheduledCRON(SCHEDULED_CRON).setBody('cron-scheduled');
      });

      const scheduled = RedisSMQ.createQueueScheduledMessages();
      const page = await scheduled.getMessages(queue, 0, 100);

      expect(page.totalItems).toBe(1);
      expect(page.items).toHaveLength(1);
      expect(page.items[0].id).toBe(id);
    });
  });

  // -------------------------------------------------------------------------
  // Repeat
  // -------------------------------------------------------------------------

  describe('with a repeat count and period', () => {
    it('places the message in the scheduled list', async () => {
      const queue = uniqueQueue('sched-repeat');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const id = await produceScheduledMessage(queue, (msg) => {
        msg
          .setScheduledRepeat(3)
          .setScheduledRepeatPeriod(5000)
          .setBody('repeat-scheduled');
      });

      const scheduled = RedisSMQ.createQueueScheduledMessages();
      const page = await scheduled.getMessages(queue, 0, 100);

      expect(page.totalItems).toBe(1);
      expect(page.items).toHaveLength(1);
      expect(page.items[0].id).toBe(id);
    });
  });

  // -------------------------------------------------------------------------
  // Scheduled messages do not appear in pending
  // -------------------------------------------------------------------------

  describe('isolation from the pending list', () => {
    it('does not place a scheduled message in the pending list', async () => {
      const queue = uniqueQueue('sched-not-pending');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await produceScheduledMessage(queue, (msg) => {
        msg.setScheduledDelay(SCHEDULED_DELAY_MS).setBody('delayed');
      });

      const pending = RedisSMQ.createQueuePendingMessages();
      const pendingPage = await pending.getMessages(queue, 0, 100);
      expect(pendingPage.totalItems).toBe(0);

      expect(await pending.countMessages(queue)).toBe(0);

      // The aggregate status breakdown confirms the message is counted
      // as scheduled and not as pending. `countMessagesByStatus`
      // reads from the same state as the individual accessors, but a
      // regression that swapped a bucket would surface only here.
      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const counts = await queueMessages.countMessagesByStatus(queue);
      expect(counts).toEqual({
        pending: 0,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 1,
      });
    });

    it('keeps multiple scheduled messages out of the pending list', async () => {
      // Two scheduled messages, one with each of two parameters. Both
      // stay in the scheduled list; neither leaks into pending.
      const queue = uniqueQueue('sched-multiple');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const delayId = await produceScheduledMessage(queue, (msg) => {
        msg.setScheduledDelay(SCHEDULED_DELAY_MS).setBody('delayed');
      });
      const cronId = await produceScheduledMessage(queue, (msg) => {
        msg.setScheduledCRON(SCHEDULED_CRON).setBody('cron');
      });

      const scheduled = RedisSMQ.createQueueScheduledMessages();
      const scheduledPage = await scheduled.getMessages(queue, 0, 100);

      expect(scheduledPage.totalItems).toBe(2);
      expect(scheduledPage.items).toHaveLength(2);

      // Both IDs are present, in whatever order the storage returned
      // them. A `Set` comparison avoids making the assertion sensitive
      // to the sorted-set's internal ordering.
      const scheduledIds = new Set(scheduledPage.items.map((m) => m.id));
      expect(scheduledIds).toEqual(new Set([delayId, cronId]));

      // And the pending list remains empty.
      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(0);

      // The aggregate view shows both scheduled and nothing pending.
      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const counts = await queueMessages.countMessagesByStatus(queue);
      expect(counts).toEqual({
        pending: 0,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 2,
      });
    });
  });
});
