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
  EQueueType,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for purging pending messages.
 *
 * A queue's pending list can be emptied through two entry points:
 *
 *   - `QueuePublishedMessages.purge(queue)` — purges the queue.
 *     Removes messages in every state the queue tracks.
 *
 *   - `QueuePendingMessages.purge(queue)` — purges only the pending
 *     list. Messages in other states — acknowledged, dead-lettered,
 *     scheduled — are left where they are.
 *
 * Both are asynchronous. The call returns once the purge *job* has been
 * scheduled; a background worker (`PurgeQueueWorker`) does the actual
 * removal in batches. This is why the tests poll the queue's counts to
 * settle rather than reading them immediately after the call returns.
 *
 *   The job-ID return value of `purge` is not asserted here. The
 *   caller-visible contract is "the messages are gone"; how the
 *   framework sequences the background work behind that contract is
 *   an implementation detail. The job's own mechanics are covered in
 *   `purge-worker.test.ts`.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Timeout for the purge worker to complete.
 *
 * The purge schedules a background job; the worker picks it up on its
 * next tick and processes messages in batches. For a handful of
 * messages the total latency is a few hundred milliseconds on a quiet
 * machine; 15 seconds is generous for a loaded CI.
 */
const PURGE_TIMEOUT_MS = 15_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce `count` messages to `queue` and return their IDs.
 *
 * The producer is started and shut down per call. A shared instance
 * would work, but per-call setup keeps the resource accounting trivial
 * and each test's setup independent.
 */
async function producePendingMessages(
  queue: IQueueParams,
  count: number,
): Promise<string[]> {
  const producer = await startProducer();
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody(`message-${i}`),
    );
    ids.push(id);
  }
  await producer.shutdown();
  return ids;
}

/**
 * Wait until the queue's pending count reaches `expected`.
 *
 * The purge job runs in the background, so the count does not change
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
      description: `queue ${queue.ns}:${queue.name} pending count reached ${expected}`,
    },
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Purging pending messages', () => {
  // -------------------------------------------------------------------------
  // QueuePublishedMessages.purge
  // -------------------------------------------------------------------------

  describe('via QueuePublishedMessages.purge', () => {
    it('empties the pending list', async () => {
      const queue = uniqueQueue('purge-pending-published');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await producePendingMessages(queue, 3);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      // Pre-state: three messages in pending.
      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.pending).toBe(3);

      await queueMessages.purge(queue);

      // Poll for the purge to take effect.
      await waitForPendingCount(queue, 0);

      // Confirm the other states are also at zero — nothing was
      // produced into them.
      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after).toEqual({
        pending: 0,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 0,
      });

      // The pending accessor agrees with the aggregate. Both read the
      // same storage, so a divergence would point at one of the
      // accessors.
      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(queue)).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // QueuePendingMessages.purge
  // -------------------------------------------------------------------------

  describe('via QueuePendingMessages.purge', () => {
    it('empties the pending list', async () => {
      const queue = uniqueQueue('purge-pending-pending');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await producePendingMessages(queue, 2);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const pending = RedisSMQ.createQueuePendingMessages();

      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.pending).toBe(2);

      await pending.purge(queue);

      await waitForPendingCount(queue, 0);

      // Both accessors agree the pending list is empty.
      expect(await pending.countMessages(queue)).toBe(0);

      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after.pending).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Scoping
  // -------------------------------------------------------------------------

  describe('scoping', () => {
    it('QueuePendingMessages.purge leaves acknowledged messages in place', async () => {
      const queue = uniqueQueue('purge-pending-scoping');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Step 1: produce two messages and ack both, producing a
      // non-empty acknowledged list.
      const consumer = await getConsumer({
        queue,
        messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
      });

      const producer = await startProducer();
      const ackedIds: string[] = [];
      const ackedWaiters: Promise<void>[] = [];

      for (let i = 0; i < 2; i += 1) {
        const [id] = await producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody(`acked-${i}`),
        );
        ackedIds.push(id);
      }

      // Subscribe to the ack events before running the consumer.
      for (const id of ackedIds) {
        ackedWaiters.push(untilMessageAcknowledged(consumer, id));
      }

      await consumer.run();
      await Promise.all(ackedWaiters);
      await consumer.shutdown();

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      expect(await acknowledged.countMessages(queue)).toBe(2);

      // Step 2: produce one more message that stays pending.
      await producePendingMessages(queue, 1);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.pending).toBe(1);
      expect(before.acknowledged).toBe(2);

      // Step 3: purge only the pending list.
      const pending = RedisSMQ.createQueuePendingMessages();
      await pending.purge(queue);

      await waitForPendingCount(queue, 0);

      // The pending message is gone; the acknowledged messages remain.
      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after.pending).toBe(0);
      expect(after.acknowledged).toBe(2);

      // The acknowledged accessor confirms the same thing from its own
      // path — the two reads are independent, so agreement here means
      // the state itself is consistent.
      expect(await acknowledged.countMessages(queue)).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Empty queue
  // -------------------------------------------------------------------------

  describe('empty queue', () => {
    it('resolves without error when QueuePublishedMessages.purge runs on an empty queue', async () => {
      const queue = uniqueQueue('purge-pending-empty-published');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      // Confirm the queue is empty before the purge.
      expect(await queueMessages.countMessages(queue)).toBe(0);

      await expect(queueMessages.purge(queue)).resolves.toBeDefined();

      // The queue remains readable and its counts are still zero.
      expect(await queueMessages.countMessages(queue)).toBe(0);
    });

    it('resolves without error when QueuePendingMessages.purge runs on an empty queue', async () => {
      const queue = uniqueQueue('purge-pending-empty-pending');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const pending = RedisSMQ.createQueuePendingMessages();

      expect(await pending.countMessages(queue)).toBe(0);

      await expect(pending.purge(queue)).resolves.toBeDefined();

      expect(await pending.countMessages(queue)).toBe(0);
    });
  });
});
