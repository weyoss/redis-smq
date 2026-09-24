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
  EQueueDeliveryModel,
  EQueueType,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { produceAndAck } from '../../helpers/scenarios/message-lifecycle.js';

/**
 * Integration tests for the queue metrics accessors.
 *
 * RedisSMQ exposes five read paths for a queue's messages, each
 * with the same shape:
 *
 *   - `countMessages(queue)` — total messages the accessor tracks.
 *   - `countMessagesByStatus(queue)` — a breakdown by state, where the
 *     accessor supports it (only `QueuePublishedMessages`).
 *   - `getMessages(queue, from, to)` — a paginated slice of the
 *     underlying storage, as `{ totalItems, items }`.
 *
 * The five accessors:
 *
 *   - `QueuePublishedMessages` — the aggregate view. Reports a
 *     breakdown by state and a total across all states.
 *
 *   - `QueuePendingMessages` — the pending list.
 *   - `QueueAcknowledgedMessages` — the acknowledged list.
 *   - `QueueDeadLetteredMessages` — the dead-letter list.
 *   - `QueueScheduledMessages` — the scheduled list.
 *
 * Each state-specific accessor reports a single count and returns
 * messages of that state. The aggregate accessor reports the four
 * state counts.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Scheduled delay for the scheduled-state setup message.
 *
 * Long enough that no test or CI hiccup could fire the message during
 * the test.
 */
const SCHEDULED_DELAY_MS = 60_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce `count` messages to `queue`, leaving them in the pending
 * list. No consumer is registered, so the messages stay pending.
 */
async function producePending(
  queue: IQueueParams,
  count: number,
): Promise<string[]> {
  const producer = await startProducer();
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody(`pending-${i}`),
    );
    ids.push(id);
  }
  await producer.shutdown();
  return ids;
}

/**
 * Produce `count` scheduled messages with a long delay. No schedule
 * worker is running, so the messages stay in the scheduled list.
 */
async function produceScheduled(
  queue: IQueueParams,
  count: number,
): Promise<void> {
  const producer = await startProducer();
  for (let i = 0; i < count; i += 1) {
    await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody(`scheduled-${i}`)
        .setScheduledDelay(SCHEDULED_DELAY_MS),
    );
  }
  await producer.shutdown();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Queue metrics', () => {
  // -------------------------------------------------------------------------
  // Empty queue
  // -------------------------------------------------------------------------

  describe('empty queue', () => {
    it('reports zero on every accessor', async () => {
      const queue = uniqueQueue('metrics-empty');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const pending = RedisSMQ.createQueuePendingMessages();
      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const scheduled = RedisSMQ.createQueueScheduledMessages();

      // The aggregate view reports zero total and zero per state.
      expect(await queueMessages.countMessages(queue)).toBe(0);

      const counts = await queueMessages.countMessagesByStatus(queue);
      expect(counts).toEqual({
        pending: 0,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 0,
      });

      // Each state-specific accessor reports zero.
      expect(await pending.countMessages(queue)).toBe(0);
      expect(await acknowledged.countMessages(queue)).toBe(0);
      expect(await deadLettered.countMessages(queue)).toBe(0);
      expect(await scheduled.countMessages(queue)).toBe(0);
    });

    it('returns an empty page from every getMessages accessor', async () => {
      const queue = uniqueQueue('metrics-empty-pages');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const pending = RedisSMQ.createQueuePendingMessages();
      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
      const scheduled = RedisSMQ.createQueueScheduledMessages();

      const queueMessagesPage = await queueMessages.getMessages(queue, 0, 100);
      expect(queueMessagesPage.totalItems).toBe(0);
      expect(queueMessagesPage.items).toEqual([]);

      const pendingPage = await pending.getMessages(queue, 0, 100);
      expect(pendingPage.totalItems).toBe(0);
      expect(pendingPage.items).toEqual([]);

      const acknowledgedPage = await acknowledged.getMessages(queue, 0, 100);
      expect(acknowledgedPage.totalItems).toBe(0);
      expect(acknowledgedPage.items).toEqual([]);

      const deadLetteredPage = await deadLettered.getMessages(queue, 0, 100);
      expect(deadLetteredPage.totalItems).toBe(0);
      expect(deadLetteredPage.items).toEqual([]);

      const scheduledPage = await scheduled.getMessages(queue, 0, 100);
      expect(scheduledPage.totalItems).toBe(0);
      expect(scheduledPage.items).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Pending
  // -------------------------------------------------------------------------

  describe('pending messages', () => {
    it('reports the pending count and returns the produced messages', async () => {
      const queue = uniqueQueue('metrics-pending');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const ids = await producePending(queue, 3);

      const pending = RedisSMQ.createQueuePendingMessages();
      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      // The state-specific count.
      expect(await pending.countMessages(queue)).toBe(3);

      // The aggregate view agrees — one bucket non-zero, others zero.
      const counts = await queueMessages.countMessagesByStatus(queue);
      expect(counts).toEqual({
        pending: 3,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 0,
      });

      // The total on the aggregate accessor matches.
      expect(await queueMessages.countMessages(queue)).toBe(3);

      // The paginated read returns the messages with the correct IDs.
      // Comparing as a `Set` because the storage order is not
      // guaranteed to match the production order.
      const page = await pending.getMessages(queue, 0, 100);
      expect(page.totalItems).toBe(3);
      expect(page.items).toHaveLength(3);
      expect(new Set(page.items.map((m) => m.id))).toEqual(new Set(ids));

      // Every item carries the queue as its destination. This is the
      // shape assertion — a regression that returned bare IDs would
      // fail here.
      for (const msg of page.items) {
        expect(msg.destinationQueue).toEqual(queue);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Pending messages for a PUB_SUB queue
  // -------------------------------------------------------------------------

  describe('pending messages for a PUB_SUB queue', () => {
    it('reports an aggregate pending count for a PUB_SUB queue', async () => {
      const queue = uniqueQueue('metrics-pubsub-pending');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      // Register two consumer groups. Without at least one group, a
      // message produced to a PUB_SUB queue has no destination — the
      // resolver returns an empty target list and the produce fails.
      const consumerGroups = RedisSMQ.createConsumerGroupsManager();
      await consumerGroups.saveConsumerGroup(queue, 'group-a');
      await consumerGroups.saveConsumerGroup(queue, 'group-b');

      // One produce. With two consumer groups, RedisSMQ delivers
      // to both.
      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody('pubsub-pending'),
      );
      await producer.shutdown();

      const queueMessages = RedisSMQ.createQueuePublishedMessages();
      const counts = await queueMessages.countMessagesByStatus(queue);

      // Observed behavior: a number, positive. RedisSMQ
      // aggregated the per-group storage into a single count rather
      // than returning the map.
      expect(typeof counts.pending).toBe('number');
      expect(counts.pending).toBe(2);

      // The total on the aggregate accessor matches the pending
      // bucket — nothing else was produced into another state.
      expect(await queueMessages.countMessages(queue)).toBe(counts.pending);

      // The non-pending buckets stay plain numbers, which matches the
      // documented contract for those states.
      expect(counts.acknowledged).toBe(0);
      expect(counts.deadLettered).toBe(0);
      expect(counts.scheduled).toBe(0);
    });

    it('decreases the aggregate pending count when a consumer group consumes', async () => {
      // The behavioral contract that holds regardless of the shape
      // question: consuming from one group reduces the aggregate
      // pending count.
      const queue = uniqueQueue('metrics-pubsub-independent');
      await createQueue(
        queue,
        EQueueType.FIFO_QUEUE,
        EQueueDeliveryModel.PUB_SUB,
      );

      const consumerGroups = RedisSMQ.createConsumerGroupsManager();
      const groupA = 'group-a';
      await consumerGroups.saveConsumerGroup(queue, groupA);
      await consumerGroups.saveConsumerGroup(queue, 'group-b');

      // Two produces. Each delivers to both groups.
      const producer = await startProducer();
      for (let i = 0; i < 2; i += 1) {
        await producer.produce(
          RedisSMQ.newProducibleMessage().setQueue(queue).setBody(`msg-${i}`),
        );
      }
      await producer.shutdown();

      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      // Pre-state: a positive aggregate pending count. The exact
      // number is not asserted — the test cares about the transition,
      // not about the initial multiplier.
      const before = await queueMessages.countMessagesByStatus(queue);
      expect(before.pending).toBe(4);

      // Consume from group A only. The consumer registers on the group
      // explicitly via the `{ queueParams, groupId }` form, so it polls
      // group A's pending list and not group B's.
      const consumer = createBareConsumer();
      await consumer.consume(
        { queueParams: queue, groupId: groupA },
        (_msg: IMessageTransferable, cb: ICallback) => cb(),
      );
      await consumer.run();

      // Wait for the aggregate pending count to decrease.
      await waitFor(
        async () => {
          const c = await queueMessages.countMessagesByStatus(queue);
          return c.pending < before.pending;
        },
        {
          timeoutMs: 10_000,
          description:
            'aggregate pending count decreased after group A consumed',
        },
      );

      await consumer.shutdown();

      // Post-state: the count has decreased and remains non-negative.
      const after = await queueMessages.countMessagesByStatus(queue);
      expect(after.pending).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Acknowledged
  // -------------------------------------------------------------------------

  describe('acknowledged messages', () => {
    it('reports the acknowledged count and returns the acked messages', async () => {
      const queue = uniqueQueue('metrics-acked');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const ids = await produceAndAck(queue, 2);

      const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      expect(await acknowledged.countMessages(queue)).toBe(2);

      const counts = await queueMessages.countMessagesByStatus(queue);
      expect(counts).toEqual({
        pending: 0,
        acknowledged: 2,
        deadLettered: 0,
        scheduled: 0,
      });

      const page = await acknowledged.getMessages(queue, 0, 100);
      expect(page.totalItems).toBe(2);
      expect(page.items).toHaveLength(2);
      expect(new Set(page.items.map((m) => m.id))).toEqual(new Set(ids));
    });
  });

  // -------------------------------------------------------------------------
  // Scheduled
  // -------------------------------------------------------------------------

  describe('scheduled messages', () => {
    it('reports the scheduled count and returns the scheduled messages', async () => {
      const queue = uniqueQueue('metrics-scheduled');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      await produceScheduled(queue, 2);

      const scheduled = RedisSMQ.createQueueScheduledMessages();
      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      expect(await scheduled.countMessages(queue)).toBe(2);

      const counts = await queueMessages.countMessagesByStatus(queue);
      expect(counts).toEqual({
        pending: 0,
        acknowledged: 0,
        deadLettered: 0,
        scheduled: 2,
      });

      const page = await scheduled.getMessages(queue, 0, 100);
      expect(page.totalItems).toBe(2);
      expect(page.items).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Aggregation across states
  // -------------------------------------------------------------------------

  describe('aggregation across states', () => {
    it('reports the correct breakdown when the queue has messages in multiple states', async () => {
      const queue = uniqueQueue('metrics-multi-state');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      // Two scheduled messages (no worker fires them).
      await produceScheduled(queue, 2);

      // Two acknowledged messages (via a temporary consumer).
      await produceAndAck(queue, 2);

      // Three pending messages (no consumer).
      await producePending(queue, 3);

      const queueMessages = RedisSMQ.createQueuePublishedMessages();

      const counts = await queueMessages.countMessagesByStatus(queue);
      expect(counts).toEqual({
        pending: 3,
        acknowledged: 2,
        deadLettered: 0,
        scheduled: 2,
      });

      // The total on the aggregate accessor is the sum of the four
      // buckets.
      expect(await queueMessages.countMessages(queue)).toBe(7);

      // Each state-specific accessor agrees with its corresponding
      // bucket on the aggregate. The aggregate is derived from the
      // same storage, so a divergence would point at one of the two
      // accessors rather than at the state.
      expect(
        await RedisSMQ.createQueuePendingMessages().countMessages(queue),
      ).toBe(counts.pending);
      expect(
        await RedisSMQ.createQueueAcknowledgedMessages().countMessages(queue),
      ).toBe(counts.acknowledged);
      expect(
        await RedisSMQ.createQueueDeadLetteredMessages().countMessages(queue),
      ).toBe(counts.deadLettered);
      expect(
        await RedisSMQ.createQueueScheduledMessages().countMessages(queue),
      ).toBe(counts.scheduled);
    });
  });
});
