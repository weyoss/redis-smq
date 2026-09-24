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
 * Integration tests for deleting acknowledged messages.
 *
 * An acknowledged message has been delivered to a handler, processed
 * successfully, and moved to the acknowledged list. The delete
 * operations are the same as for pending messages:
 *
 *     deleteMessageById(id)         — one message
 *     deleteMessagesByIds([...ids]) — several, in a single round trip
 *
 * Both return `{ status, stats }` with the same per-message counters
 * described in `delete-pending.test.ts`. For an acknowledged message
 * that exists and is not being processed, `stats` is
 * `{ processed: 1, success: 1, notFound: 0, inProcess: 0 }` and the
 * status is `OK`.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce a message, deliver it to a consumer that acks it, and shut
 * the consumer down.
 *
 * The consumer is essential: the acknowledged state is only reached by
 * delivery and success. It must then be shut down because a live
 * consumer would poll the queue during the test body, competing with
 * the delete operations for Redis reads (and, more importantly, holding
 * an EXCLUSIVE pool connection that the delete's own Redis work might
 * contend with on a full pool).
 *
 * The `priority` parameter is optional and only relevant for priority
 * queues — RedisSMQ rejects a message destined for a priority
 * queue without a priority. For FIFO queues, passing nothing is
 * correct.
 */
async function produceAcknowledgedMessage(
  queue: IQueueParams,
  priority?: EMessagePriority,
): Promise<string> {
  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
  });

  const producer = await startProducer();
  const msg = RedisSMQ.newProducibleMessage()
    .setQueue(queue)
    .setBody('will-be-acked');
  if (priority !== undefined) msg.setPriority(priority);

  const [messageId] = await producer.produce(msg);

  await consumer.run();

  await waitForMessageStatus(messageId, EMessagePropertyStatus.ACKNOWLEDGED, {
    timeoutMs: 10_000,
    description: `setup: message ${messageId} reached ACKNOWLEDGED`,
  });

  await consumer.shutdown();
  await producer.shutdown();

  return messageId;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Delete acknowledged messages', () => {
  // -------------------------------------------------------------------------
  // Single message by ID
  // -------------------------------------------------------------------------

  describe('deleteMessageById', () => {
    it('removes an acknowledged message from a FIFO queue', async () => {
      const queue = uniqueQueue('delete-acked');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const messageId = await produceAcknowledgedMessage(queue);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      const before = await acknowledged.getMessages(queue, 0, 100);
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

      // The message is gone from the acknowledged list, and the count
      // reflects it.
      const after = await acknowledged.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);
      expect(after.items).toHaveLength(0);

      const count = await acknowledged.countMessages(queue);
      expect(count).toBe(0);
    });

    it('removes an acknowledged message from a priority queue', async () => {
      const queue = uniqueQueue('delete-acked-prio');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      const messageId = await produceAcknowledgedMessage(
        queue,
        EMessagePriority.LOW,
      );

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      const before = await acknowledged.getMessages(queue, 0, 100);
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

      const after = await acknowledged.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);

      const count = await acknowledged.countMessages(queue);
      expect(count).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Multiple messages by IDs
  // -------------------------------------------------------------------------

  describe('deleteMessagesByIds', () => {
    it('removes several acknowledged messages from a FIFO queue in one call', async () => {
      const queue = uniqueQueue('delete-acked-many');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const id1 = await produceAcknowledgedMessage(queue);
      const id2 = await produceAcknowledgedMessage(queue);

      const expectedIds = [id1, id2].sort();

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      const before = await acknowledged.getMessages(queue, 0, 100);
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

      const after = await acknowledged.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);

      const count = await acknowledged.countMessages(queue);
      expect(count).toBe(0);
    });

    it('removes several acknowledged priority messages in one call', async () => {
      const queue = uniqueQueue('delete-acked-prio-many');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      const id1 = await produceAcknowledgedMessage(queue, EMessagePriority.LOW);
      const id2 = await produceAcknowledgedMessage(queue, EMessagePriority.LOW);

      const expectedIds = [id1, id2].sort();

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      const before = await acknowledged.getMessages(queue, 0, 100);
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

      const after = await acknowledged.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);

      const count = await acknowledged.countMessages(queue);
      expect(count).toBe(0);
    });
  });
});
