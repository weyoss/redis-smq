/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EMessagePriority, EQueueType, RedisSMQ } from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { produceOne } from '../../helpers/factories/message.js';

/**
 * Integration tests for deleting pending messages.
 *
 * A pending message has been produced and queued but not yet checked
 * out by a consumer. It can be removed from the queue via two operations
 * on `MessageManager`:
 *
 *     deleteMessageById(id)         — one message
 *     deleteMessagesByIds([...ids]) — several, in a single round trip
 *
 * Both return an object with a `status` (a `TDeleteMessageStatus` string)
 * and a `stats` object carrying per-message counters:
 *
 *     {
 *       processed:  number of IDs RedisSMQ looked at
 *       success:    number of messages actually deleted
 *       notFound:   number that did not exist or were in an undeletable state
 *       inProcess:  number currently checked out by a consumer
 *     }
 *
 * For a pending message that exists and is not being processed, the
 * expected `stats` is `{ processed: 1, success: 1, notFound: 0,
 * inProcess: 0 }` and the status is `OK`. Multiple IDs sum the counters.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Delete pending messages', () => {
  // -------------------------------------------------------------------------
  // Single message by ID
  // -------------------------------------------------------------------------

  describe('deleteMessageById', () => {
    it('removes a pending message from a FIFO queue', async () => {
      const queue = uniqueQueue('delete-pending');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const messageId = await produceOne(queue, 'body');

      // Confirm the message is pending before deleting.
      const pending = RedisSMQ.createQueuePendingMessages();
      const before = await pending.getMessages(queue, 0, 100);
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

      // The message is gone from the pending list. A delete that
      // succeeded per the stats but left the message in place would
      // fail this assertion, and the two together are the full
      // contract: the operation reports success *and* the state
      // reflects it.
      const after = await pending.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);
      expect(after.items).toHaveLength(0);

      const count = await pending.countMessages(queue);
      expect(count).toBe(0);
    });

    it('removes a pending message from a priority queue', async () => {
      const queue = uniqueQueue('delete-pending-prio');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      const messageId = await produceOne(queue, 'body', {
        priority: EMessagePriority.LOW,
      });

      const pending = RedisSMQ.createQueuePendingMessages();
      const before = await pending.getMessages(queue, 0, 100);
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

      const after = await pending.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);

      const count = await pending.countMessages(queue);
      expect(count).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Multiple messages by IDs
  // -------------------------------------------------------------------------

  describe('deleteMessagesByIds', () => {
    it('removes several pending messages from a FIFO queue in one call', async () => {
      const queue = uniqueQueue('delete-pending-many');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const id1 = await produceOne(queue, 'body');
      const id2 = await produceOne(queue, 'body');

      // Compare as sets, not sequences. RedisSMQ reads the pending
      // list in whatever order Redis returns it — insertion order is
      // not guaranteed for a batch of separate produce calls. Sorting
      // both sides before comparison makes the assertion on membership
      // rather than on incidental ordering.
      const expectedIds = [id1, id2].sort();

      const pending = RedisSMQ.createQueuePendingMessages();
      const before = await pending.getMessages(queue, 0, 100);
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

      const after = await pending.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);

      const count = await pending.countMessages(queue);
      expect(count).toBe(0);

      // Aggregate queue metrics reflect the deletion. `countMessages`
      // on the published-messages manager counts every message
      // regardless of status; a deleted message contributes to none of
      // the status buckets and to no total.
      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const total = await queueMessages.countMessages(queue);
      expect(total).toBe(0);
    });

    it('removes several pending priority messages in one call', async () => {
      const queue = uniqueQueue('delete-pending-prio-many');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      const id1 = await produceOne(queue, 'body', {
        priority: EMessagePriority.LOW,
      });
      const id2 = await produceOne(queue, 'body', {
        priority: EMessagePriority.LOW,
      });

      const expectedIds = [id1, id2].sort();

      const pending = RedisSMQ.createQueuePendingMessages();
      const before = await pending.getMessages(queue, 0, 100);
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

      const after = await pending.getMessages(queue, 0, 100);
      expect(after.totalItems).toBe(0);

      const count = await pending.countMessages(queue);
      expect(count).toBe(0);
    });
  });
});
