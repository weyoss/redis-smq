/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EMessagePriority,
  EMessagePropertyStatus,
  EQueueType,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for deleting dead-lettered messages.
 *
 * A dead-lettered message has failed processing in a way RedisSMQ
 * considers terminal: the retry threshold was exhausted, the TTL
 * elapsed before checkout, or the message was a periodic message whose
 * schedule ended. Regardless of cause, the message ends up in the
 * dead-letter list, where it stays until either:
 *
 *   - It is requeued via `requeueMessageById` (a copy is created; the
 *     original stays — see the requeue files).
 *
 *   - It is deleted via `deleteMessageById` or `deleteMessagesByIds`
 *     (the record is removed entirely).
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce a message, drive it to the dead-letter state, and shut the
 * setup's consumer and producer down.
 *
 * Uses `retryThreshold: 0` so the first failure is terminal. With a
 * larger threshold, the message would cycle through the retry pipeline
 * — requeue, redeliver, fail again — before dead-lettering. For a test
 * whose subject is the delete operation, that retry time is pure setup
 * cost. The message's final state is DEAD_LETTERED either way; the
 * threshold only controls how long it takes to get there.
 *
 * The handler fails on every delivery. With `retryThreshold: 0`, the
 * framework permits one delivery and one failure, and the message
 * dead-letters immediately.
 *
 * The `priority` parameter is optional; it is required when the queue
 * is a priority queue (RedisSMQ rejects a message without a
 * priority destined for such a queue).
 */
async function produceDeadLetteredMessage(
  queue: IQueueParams,
  priority?: EMessagePriority,
): Promise<string> {
  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
      cb(new Error('setup: always fails')),
  });

  const producer = await startProducer();
  const msg = RedisSMQ.newProducibleMessage()
    .setQueue(queue)
    .setBody('will-be-dead-lettered')
    .setRetryThreshold(0);
  if (priority !== undefined) msg.setPriority(priority);

  const [messageId] = await producer.produce(msg);

  await consumer.run();

  await waitForMessageStatus(messageId, EMessagePropertyStatus.DEAD_LETTERED, {
    timeoutMs: 10_000,
    description: `setup: message ${messageId} reached DEAD_LETTERED`,
  });

  await consumer.shutdown();
  await producer.shutdown();

  return messageId;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Delete dead-lettered messages', () => {
  // -------------------------------------------------------------------------
  // Single message by ID
  // -------------------------------------------------------------------------

  describe('deleteMessageById', () => {
    it('removes a dead-lettered message from a FIFO queue', async () => {
      const queue = uniqueQueue('delete-dl');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const messageId = await produceDeadLetteredMessage(queue);

      // Confirm the message is present in the dead-letter list before
      // deleting
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const before = await deadLettered.getMessages(queue, 0, 100);
      expect(before.totalItems).toBe(1);
      expect(before.items[0].id).toBe(messageId);

      const messageManager = RedisSMQ.createMessageManager();
      const reply = await messageManager.deleteMessageById(messageId);

      expect(reply.status).toBe('OK');
      expect(reply.stats).toEqual({
        processed: 1,
        success: 1,
        notFound: 0,
        inProcess: 0,
      });

      // The message is gone from the dead-letter list, and the count
      // reflects it.
      const after = await deadLettered.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);
      expect(after.items).toHaveLength(0);

      const count = await deadLettered.countMessages(queue);
      expect(count).toBe(0);
    });

    it('removes a dead-lettered message from a priority queue', async () => {
      const queue = uniqueQueue('delete-dl-prio');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      const messageId = await produceDeadLetteredMessage(
        queue,
        EMessagePriority.LOW,
      );

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const before = await deadLettered.getMessages(queue, 0, 100);
      expect(before.totalItems).toBe(1);
      expect(before.items[0].id).toBe(messageId);

      const messageManager = RedisSMQ.createMessageManager();
      const reply = await messageManager.deleteMessageById(messageId);

      expect(reply.status).toBe('OK');
      expect(reply.stats).toEqual({
        processed: 1,
        success: 1,
        notFound: 0,
        inProcess: 0,
      });

      const after = await deadLettered.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);

      const count = await deadLettered.countMessages(queue);
      expect(count).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Multiple messages by IDs
  // -------------------------------------------------------------------------

  describe('deleteMessagesByIds', () => {
    it('removes several dead-lettered messages from a FIFO queue in one call', async () => {
      const queue = uniqueQueue('delete-dl-many');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Produce-and-dead-letter two messages sequentially. Each setup
      // runs its own consumer lifecycle; running them one after the
      // other keeps the resource usage bounded and makes a failure in
      // the second setup distinguishable from a failure in the first.
      const id1 = await produceDeadLetteredMessage(queue);
      const id2 = await produceDeadLetteredMessage(queue);

      const expectedIds = [id1, id2].sort();

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const before = await deadLettered.getMessages(queue, 0, 100);
      expect(before.totalItems).toBe(2);

      const beforeIds = before.items.map((i) => i.id).sort();
      expect(beforeIds).toEqual(expectedIds);

      const messageManager = RedisSMQ.createMessageManager();
      const reply = await messageManager.deleteMessagesByIds([id1, id2]);

      expect(reply.status).toBe('OK');
      expect(reply.stats).toEqual({
        processed: 2,
        success: 2,
        notFound: 0,
        inProcess: 0,
      });

      const after = await deadLettered.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);

      const count = await deadLettered.countMessages(queue);
      expect(count).toBe(0);

      // Aggregate queue metrics reflect the deletion. The published
      // manager counts every message regardless of state; with both
      // dead-lettered messages removed, the total is zero.
      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const total = await queueMessages.countMessages(queue);
      expect(total).toBe(0);
    });

    it('removes several dead-lettered priority messages in one call', async () => {
      const queue = uniqueQueue('delete-dl-prio-many');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      const id1 = await produceDeadLetteredMessage(queue, EMessagePriority.LOW);
      const id2 = await produceDeadLetteredMessage(queue, EMessagePriority.LOW);

      const expectedIds = [id1, id2].sort();

      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const before = await deadLettered.getMessages(queue, 0, 100);
      expect(before.totalItems).toBe(2);

      const beforeIds = before.items.map((i) => i.id).sort();
      expect(beforeIds).toEqual(expectedIds);

      const messageManager = RedisSMQ.createMessageManager();
      const reply = await messageManager.deleteMessagesByIds([id1, id2]);

      expect(reply.status).toBe('OK');
      expect(reply.stats).toEqual({
        processed: 2,
        success: 2,
        notFound: 0,
        inProcess: 0,
      });

      const after = await deadLettered.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);

      const count = await deadLettered.countMessages(queue);
      expect(count).toBe(0);
    });
  });
});
