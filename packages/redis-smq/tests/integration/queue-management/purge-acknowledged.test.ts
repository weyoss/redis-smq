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
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { produceAndAck } from '../../helpers/scenarios/message-lifecycle.js';

/**
 * Integration tests for purging acknowledged messages.
 *
 * An acknowledged message has been delivered to a handler, processed
 * successfully, and moved to the acknowledged list. Like pending
 * messages, it can be removed through two entry points:
 *
 *   - `QueuePublishedMessages.purge(queue)` — purges the queue in full.
 *     Removes messages in every state the queue tracks.
 *
 *   - `QueueAcknowledgedMessages.purge(queue)` — purges only the
 *     acknowledged list. Messages in other states are left in place.
 *
 * The distinction mirrors the pending case: the state-specific purge
 * is scoped, the whole-queue purge is not.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Timeout for the purge worker to complete.
 *
 * Same rationale as the other purge files: the purge schedules a
 * background job; the worker picks it up on its next tick and processes
 * messages in batches.
 */
const PURGE_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wait until the acknowledged count reaches `expected`.
 *
 * The purge runs in the background, so the count does not change
 * synchronously with the `purge()` call returning.
 */
async function waitForAcknowledgedCount(
  queue: IQueueParams,
  expected: number,
): Promise<void> {
  const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
  await waitFor(
    async () => (await acknowledged.countMessages(queue)) === expected,
    {
      timeoutMs: PURGE_TIMEOUT_MS,
      description: `queue ${queue.ns}:${queue.name} acknowledged count reached ${expected}`,
    },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Purging acknowledged messages', () => {
  // -------------------------------------------------------------------------
  // QueuePublishedMessages.purge
  // -------------------------------------------------------------------------

  describe('via QueuePublishedMessages.purge', () => {
    it('empties the acknowledged list', async () => {
      const queue = uniqueQueue('purge-acked-published');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await produceAndAck(queue, 3);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();

      // Pre-state: three messages acknowledged. Confirming this before
      // the purge makes the post-state assertion meaningful.
      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.acknowledged).toBe(3);
      expect(await acknowledged.countMessages(queue)).toBe(3);

      await queueMessages.purge(queue);

      await waitForAcknowledgedCount(queue, 0);

      // Both accessors confirm the empty state.
      expect(await acknowledged.countMessages(queue)).toBe(0);

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
  // QueueAcknowledgedMessages.purge
  // -------------------------------------------------------------------------

  describe('via QueueAcknowledgedMessages.purge', () => {
    it('empties the acknowledged list', async () => {
      // Same contract via the state-specific entry point. The two
      // purges are distinct APIs and a regression could affect one
      // without the other.
      const queue = uniqueQueue('purge-acked-specific');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await produceAndAck(queue, 2);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();

      expect(await acknowledged.countMessages(queue)).toBe(2);

      await acknowledged.purge(queue);

      await waitForAcknowledgedCount(queue, 0);

      expect(await acknowledged.countMessages(queue)).toBe(0);

      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after.acknowledged).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Scoping
  // -------------------------------------------------------------------------

  describe('scoping', () => {
    it('QueueAcknowledgedMessages.purge leaves pending messages in place', async () => {
      const queue = uniqueQueue('purge-acked-scoping');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Step 1: get two messages into the acknowledged list.
      await produceAndAck(queue, 2);

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
      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();

      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.acknowledged).toBe(2);
      expect(before.pending).toBe(1);

      // Step 3: purge only the acknowledged list.
      await acknowledged.purge(queue);

      await waitForAcknowledgedCount(queue, 0);

      // The acknowledged messages are gone; the pending message
      // remains.
      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after.acknowledged).toBe(0);
      expect(after.pending).toBe(1);

      // The pending accessor confirms the same thing from its own
      // path — the two reads are independent, so agreement here means
      // the state itself is consistent.
      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Empty queue
  // -------------------------------------------------------------------------

  describe('empty queue', () => {
    it('resolves without error when QueuePublishedMessages.purge runs on an empty queue', async () => {
      const queue = uniqueQueue('purge-acked-empty-published');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      // Confirm the queue is empty before the purge.
      expect(await queueMessages.countMessages(queue)).toBe(0);

      await expect(queueMessages.purge(queue)).resolves.toBeDefined();

      // The queue remains readable and its counts are still zero.
      expect(await queueMessages.countMessages(queue)).toBe(0);
    });

    it('resolves without error when QueueAcknowledgedMessages.purge runs on an empty queue', async () => {
      const queue = uniqueQueue('purge-acked-empty-specific');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();

      expect(await acknowledged.countMessages(queue)).toBe(0);

      await expect(acknowledged.purge(queue)).resolves.toBeDefined();

      expect(await acknowledged.countMessages(queue)).toBe(0);
    });
  });
});
