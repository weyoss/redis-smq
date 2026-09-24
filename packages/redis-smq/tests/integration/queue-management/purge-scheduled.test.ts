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
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for purging scheduled messages.
 *
 * A scheduled message has been produced with a scheduling parameter
 * (`.setScheduledDelay`, `.setScheduledCRON`, `.setScheduledRepeat`)
 * and is waiting in the scheduled list for a worker to move it to the
 * pending list. Like the other message states, it can be removed
 * through two entry points:
 *
 *   - `QueuePublishedMessages.purge(queue)` — purges the queue in
 *     full. Removes messages in every state the queue tracks.
 *
 *   - `QueueScheduledMessages.purge(queue)` — purges only the
 *     scheduled list. Messages in other states are left in place.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Timeout for the purge worker to complete.
 *
 * Same rationale as the other purge files: the purge schedules a
 * background job; the worker picks it up on its next tick and
 * processes messages in batches.
 */
const PURGE_TIMEOUT_MS = 15_000;

/**
 * Scheduled delay for the test messages.
 *
 * 60 seconds — long enough that no test or CI hiccup could bring the
 * message close to its delay boundary. The tests never wait for the
 * delay; the messages are purged while they are still scheduled.
 */
const SCHEDULED_DELAY_MS = 60_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce `count` scheduled messages to `queue` and return their IDs.
 *
 * Each message is produced with a long scheduled delay. No consumer or
 * schedule worker is running, so the messages stay in the scheduled
 * list.
 *
 * The producer is started and shut down per call. A shared instance
 * would work, but per-call setup keeps the resource accounting trivial
 * and each test's setup independent.
 */
async function produceScheduledMessages(
  queue: IQueueParams,
  count: number,
): Promise<string[]> {
  const producer = await startProducer();
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody(`scheduled-${i}`)
        .setScheduledDelay(SCHEDULED_DELAY_MS),
    );
    ids.push(id);
  }
  await producer.shutdown();
  return ids;
}

/**
 * Wait until the scheduled count reaches `expected`.
 *
 * The purge runs in the background, so the count does not change
 * synchronously with the `purge()` call returning.
 */
async function waitForScheduledCount(
  queue: IQueueParams,
  expected: number,
): Promise<void> {
  const scheduled = RedisSMQ.createQueueScheduledMessages();
  await waitFor(
    async () => (await scheduled.countMessages(queue)) === expected,
    {
      timeoutMs: PURGE_TIMEOUT_MS,
      description: `queue ${queue.ns}:${queue.name} scheduled count reached ${expected}`,
    },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Purging scheduled messages', () => {
  // -------------------------------------------------------------------------
  // QueuePublishedMessages.purge
  // -------------------------------------------------------------------------

  describe('via QueuePublishedMessages.purge', () => {
    it('empties the scheduled list', async () => {
      const queue = uniqueQueue('purge-sched-published');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await produceScheduledMessages(queue, 3);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const scheduled = RedisSMQ.createQueueScheduledMessages();

      // Pre-state: three messages scheduled. Confirming this before
      // the purge makes the post-state assertion meaningful.
      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.scheduled).toBe(3);
      expect(await scheduled.countMessages(queue)).toBe(3);

      await queueMessages.purge(queue);

      await waitForScheduledCount(queue, 0);

      // Both accessors confirm the empty state.
      expect(await scheduled.countMessages(queue)).toBe(0);

      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after).toEqual({
        pending: 0,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 0,
      });
    });
  });

  // -------------------------------------------------------------------------
  // QueueScheduledMessages.purge
  // -------------------------------------------------------------------------

  describe('via QueueScheduledMessages.purge', () => {
    it('empties the scheduled list', async () => {
      const queue = uniqueQueue('purge-sched-specific');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await produceScheduledMessages(queue, 2);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const scheduled = RedisSMQ.createQueueScheduledMessages();

      expect(await scheduled.countMessages(queue)).toBe(2);

      await scheduled.purge(queue);

      await waitForScheduledCount(queue, 0);

      expect(await scheduled.countMessages(queue)).toBe(0);

      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after.scheduled).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Scoping
  // -------------------------------------------------------------------------

  describe('scoping', () => {
    it('QueueScheduledMessages.purge leaves pending messages in place', async () => {
      const queue = uniqueQueue('purge-sched-scoping');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Step 1: get two messages into the scheduled list.
      await produceScheduledMessages(queue, 2);

      // Step 2: produce one more message that stays pending. No
      // scheduling parameter, no consumer — it sits in the pending
      // list.
      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('will-remain-pending'),
      );
      await producer.shutdown();

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const scheduled = RedisSMQ.createQueueScheduledMessages();

      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.scheduled).toBe(2);
      expect(before.pending).toBe(1);

      // Step 3: purge only the scheduled list.
      await scheduled.purge(queue);

      await waitForScheduledCount(queue, 0);

      // The scheduled messages are gone; the pending message remains.
      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after.scheduled).toBe(0);
      expect(after.pending).toBe(1);

      // The pending accessor confirms the same thing from its own
      // path — the two reads are independent, so agreement here means
      // the state itself is consistent.
      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(1);

      // The message is still queryable by ID and still in PENDING.
      const survivingId = (await pending.getMessages(queue, 0, 100)).items[0]
        .id;
      const message =
        await RedisSMQ.createMessageManager().getMessageById(survivingId);
      expect(message.status).toBe(EMessagePropertyStatus.PENDING);
    });
  });

  // -------------------------------------------------------------------------
  // Empty queue
  // -------------------------------------------------------------------------

  describe('empty queue', () => {
    it('resolves without error when QueuePublishedMessages.purge runs on an empty queue', async () => {
      const queue = uniqueQueue('purge-sched-empty-published');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      // Confirm the queue is empty before the purge.
      expect(await queueMessages.countMessages(queue)).toBe(0);

      await expect(queueMessages.purge(queue)).resolves.toBeDefined();

      // The queue remains readable and its counts are still zero.
      expect(await queueMessages.countMessages(queue)).toBe(0);
    });

    it('resolves without error when QueueScheduledMessages.purge runs on an empty queue', async () => {
      const queue = uniqueQueue('purge-sched-empty-specific');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const scheduled = RedisSMQ.createQueueScheduledMessages();

      expect(await scheduled.countMessages(queue)).toBe(0);

      await expect(scheduled.purge(queue)).resolves.toBeDefined();

      expect(await scheduled.countMessages(queue)).toBe(0);
    });
  });
});
