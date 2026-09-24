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
  EMessagePriority,
  EQueueType,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for purging pending messages on a priority queue.
 *
 * A priority queue stores its pending messages in a Redis sorted set
 * (`keyQueuePriority`), scored by the message's priority level. The
 * purge operation has to remove messages from this storage layout,
 * which differs from the list-based storage a FIFO or LIFO queue uses.
 *
 * The observable contract is the same as for a FIFO queue — the
 * pending count drops to zero — but the code path that performs the
 * removal is different. A purge implementation that assumed a list
 * (`LPOP`/`DEL` on a list key) would silently leave the priority
 * sorted set intact while reporting success.
 *
 * This file exists to exercise that distinct path. The FIFO case is
 * covered in `purge-pending.test.ts`.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Timeout for the purge worker to complete.
 *
 * Same rationale as `purge-pending.test.ts`: the purge schedules a
 * background job; the worker picks it up on its next tick and
 * processes messages in batches.
 */
const PURGE_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce one message at each of the given priorities to `queue`, and
 * return the IDs in production order.
 */
async function produceWithPriorities(
  queue: IQueueParams,
  priorities: readonly EMessagePriority[],
): Promise<string[]> {
  const producer = await startProducer();
  const ids: string[] = [];
  for (let i = 0; i < priorities.length; i += 1) {
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody(`priority-${priorities[i]}-${i}`)
        .setPriority(priorities[i]),
    );
    ids.push(id);
  }
  await producer.shutdown();
  return ids;
}

/**
 * Wait until the queue's pending count reaches `expected`.
 *
 * The purge runs in the background, so the count does not change
 * synchronously with the `purge()` call returning. Polling is the
 * correct way to observe the effect without racing it.
 */
async function waitForPendingCount(
  queue: IQueueParams,
  expected: number,
): Promise<void> {
  const queueMessages = RedisSMQ.createQueuePublishedMessages();
  await waitFor(
    async () =>
      (await queueMessages.countMessagesByStatus(queue)).pending === expected,
    {
      timeoutMs: PURGE_TIMEOUT_MS,
      description: `priority queue ${queue.ns}:${queue.name} pending count reached ${expected}`,
    },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Purging a priority queue', () => {
  // -------------------------------------------------------------------------
  // QueuePublishedMessages.purge
  // -------------------------------------------------------------------------

  describe('via QueuePublishedMessages.purge', () => {
    it('empties the pending set', async () => {
      const queue = uniqueQueue('purge-priority-published');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      // Produce three messages at distinct priority levels. The
      // priorities span the range so a purge that only handled one
      // score band — a plausible bug if the removal iterated scores
      // rather than the whole sorted set — would leave some behind.
      await produceWithPriorities(queue, [
        EMessagePriority.HIGHEST,
        EMessagePriority.NORMAL,
        EMessagePriority.VERY_LOW,
      ]);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const pending = RedisSMQ.createQueuePendingMessages();

      // Pre-state: three messages in pending. Confirming this before
      // the purge makes the post-state assertion meaningful.
      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.pending).toBe(3);

      // The pending accessor agrees — the priority set is read through
      // the same `QueuePendingMessages` API as a FIFO queue's list.
      expect(await pending.countMessages(queue)).toBe(3);

      await queueMessages.purge(queue);

      await waitForPendingCount(queue, 0);

      // Both accessors confirm the empty state.
      expect(await pending.countMessages(queue)).toBe(0);

      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after).toEqual({
        pending: 0,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 0,
      });

      // The pending list is not just empty in count — reading it
      // returns no items. A regression where the count accessor and
      // the list accessor diverged would be caught here.
      const page = await pending.getMessages(queue, 0, 100);
      expect(page.totalItems).toBe(0);
      expect(page.items).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // QueuePendingMessages.purge
  // -------------------------------------------------------------------------

  describe('via QueuePendingMessages.purge', () => {
    it('empties the pending set', async () => {
      const queue = uniqueQueue('purge-priority-pending');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      await produceWithPriorities(queue, [
        EMessagePriority.HIGH,
        EMessagePriority.LOW,
      ]);

      const pending = RedisSMQ.createQueuePendingMessages();
      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      expect(await pending.countMessages(queue)).toBe(2);

      await pending.purge(queue);

      await waitForPendingCount(queue, 0);

      expect(await pending.countMessages(queue)).toBe(0);

      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after.pending).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Priority selectivity
  // -------------------------------------------------------------------------

  describe('priority selectivity', () => {
    it('clears messages at every priority level, not just one', async () => {
      const queue = uniqueQueue('purge-priority-all-levels');
      await createQueue(queue, EQueueType.PRIORITY_QUEUE);

      await produceWithPriorities(queue, [
        EMessagePriority.HIGHEST,
        EMessagePriority.HIGH,
        EMessagePriority.ABOVE_NORMAL,
        EMessagePriority.NORMAL,
        EMessagePriority.LOW,
        EMessagePriority.VERY_LOW,
      ]);

      const pending = RedisSMQ.createQueuePendingMessages();

      expect(await pending.countMessages(queue)).toBe(6);

      await pending.purge(queue);

      await waitForPendingCount(queue, 0);

      // The count is zero, and the list is empty. Both signals agree.
      expect(await pending.countMessages(queue)).toBe(0);

      const page = await pending.getMessages(queue, 0, 100);
      expect(page.totalItems).toBe(0);
    });
  });
});
