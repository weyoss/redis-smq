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
import { untilMessageAcknowledged } from '../../helpers/events/await-event.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { findById } from '../../helpers/assertions/find-by-id.js';

/**
 * Integration tests for requeuing a message from the acknowledged list.
 *
 * `messageManager.requeueMessageById(id)` on an acknowledged message
 * publishes a *new* message onto the same queue, exactly as it does for
 * a dead-lettered message. The original stays in the acknowledged list;
 * the operation is a copy, not a move.
 *
 * Both messages carry metadata about the relationship:
 *
 *   - The new message's `messageState.requeuedMessageParentId` points
 *     at the original's ID.
 *
 *   - The original's state gains `requeuedAt` (first requeue
 *     timestamp), `lastRequeuedAt` (most recent), and `requeueCount`.
 */

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

/**
 * Produce a message and drive it to the acknowledged state.
 *
 * A consumer that calls `cb()` immediately acks the message on its first
 * delivery. The consumer is shut down before this function returns — a
 * live consumer would pick up the newly-requeued messages and move them
 * out of the pending list before the test's assertions could observe
 * them.
 */
async function produceAcknowledgedMessage(
  queue: IQueueParams,
): Promise<string> {
  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
  });

  const producer = await startProducer();
  const [messageId] = await producer.produce(
    RedisSMQ.newProducibleMessage().setQueue(queue).setBody('acknowledged'),
  );

  // Subscribe before run — the ack awaiter must be installed before
  // the consumer's first poll can fire the event.
  const acked = untilMessageAcknowledged(consumer, messageId);

  await consumer.run();
  await acked;

  await consumer.shutdown();
  await producer.shutdown();

  return messageId;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Requeue from acknowledged list', () => {
  // -------------------------------------------------------------------------
  // First requeue
  // -------------------------------------------------------------------------

  it('creates a new pending message that references the acknowledged original', async () => {
    const queue = uniqueQueue('requeue-ack');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const originalId = await produceAcknowledgedMessage(queue);

    const messageManager = RedisSMQ.createMessageManager();
    const newMessageId = await messageManager.requeueMessageById(originalId);

    // Distinct IDs. A regression that reused the original's ID would
    // collide in Redis — the original is still in the acknowledged list.
    expect(newMessageId).not.toBe(originalId);

    // The new message is in the pending list on the same queue, with
    // a `requeuedMessageParentId` pointing at the original.
    const pending = RedisSMQ.createQueuePendingMessages();
    const pendingPage = await pending.getMessages(queue, 0, 100);

    expect(pendingPage.totalItems).toBe(1);
    expect(pendingPage.items).toHaveLength(1);

    const requeued = pendingPage.items[0];
    expect(requeued.id).toBe(newMessageId);
    expect(requeued.destinationQueue).toEqual(queue);
    expect(requeued.messageState.requeuedMessageParentId).toBe(originalId);

    // The new message carries a real `publishedAt` — RedisSMQ
    // stamps it during requeue, and the assertions below compare
    // against it. If this were null, the subsequent `.toBe` comparisons
    // would pass trivially on two nulls.
    expect(typeof requeued.messageState.publishedAt).toBe('number');
    expect(requeued.messageState.publishedAt).toBeGreaterThan(0);

    // The original is still in the acknowledged list, with its requeue
    // metadata set. The operation is a copy, not a move.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const ackPage = await acknowledged.getMessages(queue, 0, 100);

    expect(ackPage.totalItems).toBe(1);
    expect(ackPage.items).toHaveLength(1);
    expect(ackPage.items[0].id).toBe(originalId);

    const originalState = ackPage.items[0].messageState;
    expect(originalState.requeueCount).toBe(1);

    // `requeuedAt` and `lastRequeuedAt` are both set to the *new*
    // message's `publishedAt` on a first requeue — there is only one
    // requeue event, so first and last coincide.
    expect(originalState.requeuedAt).toBe(requeued.messageState.publishedAt);
    expect(originalState.lastRequeuedAt).toBe(
      requeued.messageState.publishedAt,
    );

    // Aggregate queue metrics: one acknowledged, one pending. The
    // original remains in the acknowledged list — the operation does
    // not move it.
    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const counts = await queueMessages.countMessagesByStatus(queue);
    expect(counts).toEqual({
      pending: 1,
      acknowledged: 1,
      deadLettered: 0,
      scheduled: 0,
    });
  });

  // -------------------------------------------------------------------------
  // Second requeue
  // -------------------------------------------------------------------------

  it('increments requeueCount and advances lastRequeuedAt on a second requeue', async () => {
    const queue = uniqueQueue('requeue-ack-multiple');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const originalId = await produceAcknowledgedMessage(queue);

    const messageManager = RedisSMQ.createMessageManager();

    // First requeue. Capture the new message's `publishedAt` — it will
    // become the original's `requeuedAt`.
    const firstRequeueId = await messageManager.requeueMessageById(originalId);

    const pending = RedisSMQ.createQueuePendingMessages();
    const afterFirst = await pending.getMessages(queue, 0, 100);
    expect(afterFirst.items).toHaveLength(1);

    const firstRequeue = afterFirst.items[0];
    expect(firstRequeue.id).toBe(firstRequeueId);
    const firstRequeuePublishedAt = firstRequeue.messageState.publishedAt;
    expect(typeof firstRequeuePublishedAt).toBe('number');

    // The second requeue must occur at a *later* millisecond than the
    // first, so the two timestamps compared below are distinguishable.
    // Two consecutive requeues would otherwise be a fraction of a
    // millisecond apart, and Redis operations sometimes round to the
    // same millisecond under load — collapsing the distinction the
    // test exists to verify. 5ms is enough to guarantee divergence
    // without meaningfully slowing the test.
    await new Promise((resolve) => setTimeout(resolve, 5));

    // Second requeue: same original, new message.
    const secondRequeueId = await messageManager.requeueMessageById(originalId);

    expect(secondRequeueId).not.toBe(firstRequeueId);
    expect(secondRequeueId).not.toBe(originalId);

    const afterSecond = await pending.getMessages(queue, 0, 100);
    expect(afterSecond.totalItems).toBe(2);

    // Both requeued messages reference the same original.
    for (const msg of afterSecond.items) {
      expect(msg.messageState.requeuedMessageParentId).toBe(originalId);
    }

    const secondRequeue = findById(afterSecond.items, secondRequeueId);
    const secondRequeuePublishedAt = secondRequeue.messageState.publishedAt;
    expect(typeof secondRequeuePublishedAt).toBe('number');

    // The two published timestamps are distinct — the setup for the
    // divergence assertion below.
    expect(secondRequeuePublishedAt).not.toBe(firstRequeuePublishedAt);

    // The original's state has advanced. `requeueCount` is 2;
    // `lastRequeuedAt` matches the *second* requeue's publish time;
    // `requeuedAt` still matches the *first*.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const ackPage = await acknowledged.getMessages(queue, 0, 100);

    expect(ackPage.totalItems).toBe(1);
    const originalState = ackPage.items[0].messageState;

    expect(originalState.requeueCount).toBe(2);
    expect(originalState.requeuedAt).toBe(firstRequeuePublishedAt);
    expect(originalState.lastRequeuedAt).toBe(secondRequeuePublishedAt);
  });
});
