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
import { produceAndDeadLetter } from '../../helpers/scenarios/message-lifecycle.js';

/**
 * Integration tests for purging dead-lettered messages.
 *
 * A dead-lettered message has exhausted its retry policy and been
 * moved to the dead-letter list. Like the other message states, it can
 * be removed through two entry points:
 *
 *   - `QueuePublishedMessages.purge(queue)` — purges the queue in
 *     full. Removes messages in every state the queue tracks.
 *
 *   - `QueueDeadLetteredMessages.purge(queue)` — purges only the
 *     dead-letter list. Messages in other states are left in place.
 *
 * The distinction mirrors the pending and acknowledged cases: the
 * state-specific purge is scoped, the whole-queue purge is not.
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wait until the dead-lettered count reaches `expected`.
 *
 * The purge runs in the background, so the count does not change
 * synchronously with the `purge()` call returning.
 */
async function waitForDeadLetteredCount(
  queue: IQueueParams,
  expected: number,
): Promise<void> {
  const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
  await waitFor(
    async () => (await deadLettered.countMessages(queue)) === expected,
    {
      timeoutMs: PURGE_TIMEOUT_MS,
      description: `queue ${queue.ns}:${queue.name} dead-lettered count reached ${expected}`,
    },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Purging dead-lettered messages', () => {
  // -------------------------------------------------------------------------
  // QueuePublishedMessages.purge
  // -------------------------------------------------------------------------

  describe('via QueuePublishedMessages.purge', () => {
    it('empties the dead-letter list', async () => {
      const queue = uniqueQueue('purge-dl-published');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await produceAndDeadLetter(queue, 3);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

      // Pre-state: three messages dead-lettered. Confirming this
      // before the purge makes the post-state assertion meaningful.
      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.deadLettered).toBe(3);
      expect(await deadLettered.countMessages(queue)).toBe(3);

      await queueMessages.purge(queue);

      await waitForDeadLetteredCount(queue, 0);

      // Both accessors confirm the empty state.
      expect(await deadLettered.countMessages(queue)).toBe(0);

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
  // QueueDeadLetteredMessages.purge
  // -------------------------------------------------------------------------

  describe('via QueueDeadLetteredMessages.purge', () => {
    it('empties the dead-letter list', async () => {
      const queue = uniqueQueue('purge-dl-specific');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await produceAndDeadLetter(queue, 2);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

      expect(await deadLettered.countMessages(queue)).toBe(2);

      await deadLettered.purge(queue);

      await waitForDeadLetteredCount(queue, 0);

      expect(await deadLettered.countMessages(queue)).toBe(0);

      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after.deadLettered).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Scoping
  // -------------------------------------------------------------------------

  describe('scoping', () => {
    it('QueueDeadLetteredMessages.purge leaves pending messages in place', async () => {
      const queue = uniqueQueue('purge-dl-scoping');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Step 1: get two messages into the dead-letter list.
      await produceAndDeadLetter(queue, 2);

      // Step 2: produce one more message that stays pending. No
      // consumer is registered, so it sits in the pending list.
      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('will-remain-pending'),
      );
      await producer.shutdown();

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.deadLettered).toBe(2);
      expect(before.pending).toBe(1);

      // Step 3: purge only the dead-letter list.
      await deadLettered.purge(queue);

      await waitForDeadLetteredCount(queue, 0);

      // The DL messages are gone; the pending message remains.
      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after.deadLettered).toBe(0);
      expect(after.pending).toBe(1);

      // The pending accessor confirms the same thing from its own
      // path — the two reads are independent, so agreement here means
      // the state itself is consistent.
      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(1);

      // The message is still queryable by ID and still in PENDING.
      // This is a secondary confirmation that "still in the pending
      // list" means the message was not silently moved by the purge.
      const message = await RedisSMQ.createMessageManager().getMessageById(
        (await pending.getMessages(queue, 0, 100)).items[0].id,
      );
      expect(message.status).toBe(EMessagePropertyStatus.PENDING);
    });
  });

  // -------------------------------------------------------------------------
  // Empty queue
  // -------------------------------------------------------------------------

  describe('empty queue', () => {
    it('resolves without error when QueuePublishedMessages.purge runs on an empty queue', async () => {
      const queue = uniqueQueue('purge-dl-empty-published');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      // Confirm the queue is empty before the purge.
      expect(await queueMessages.countMessages(queue)).toBe(0);

      await expect(queueMessages.purge(queue)).resolves.toBeDefined();

      // The queue remains readable and its counts are still zero.
      expect(await queueMessages.countMessages(queue)).toBe(0);
    });

    it('resolves without error when QueueDeadLetteredMessages.purge runs on an empty queue', async () => {
      const queue = uniqueQueue('purge-dl-empty-specific');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

      expect(await deadLettered.countMessages(queue)).toBe(0);

      await expect(deadLettered.purge(queue)).resolves.toBeDefined();

      expect(await deadLettered.countMessages(queue)).toBe(0);
    });
  });
});
