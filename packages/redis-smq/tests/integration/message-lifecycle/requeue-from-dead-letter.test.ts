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
import { findById } from '../../helpers/assertions/find-by-id.js';

/**
 * Integration tests for requeuing a message from the dead-letter list.
 *
 * `messageManager.requeueMessageById(id)` takes a message that is in the
 * dead-letter list and publishes a *new* message onto the same queue.
 * The original stays in the dead-letter list; the operation is a copy,
 * not a move. Both messages end up carrying metadata about the
 * relationship:
 *
 *   - The new message's `messageState.requeuedMessageParentId` points
 *     at the original's ID.
 *
 *   - The original message's state gains:
 *       - `requeuedAt`     — the timestamp of the *first* requeue
 *       - `lastRequeuedAt` — the timestamp of the most recent requeue
 *       - `requeueCount`   — how many times it has been requeued
 *
 * Requeuing the same dead-lettered message twice produces two distinct
 * new messages, and the original's `requeueCount` becomes 2. The two
 * timestamps diverge on the second requeue: `requeuedAt` remains at the
 * first requeue's value, `lastRequeuedAt` advances to the second's.
 */

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

/**
 * Produce a message and drive it to the dead-letter list.
 *
 * Uses `retryThreshold: 0` so the first failure dead-letters — the test
 * does not need to exercise the retry pipeline to set up its subject.
 *
 * The consumer is shut down before this function returns. A live
 * consumer would poll the queue, pick up the newly-requeued messages
 * and move them out of the pending list before the test's assertions
 * could observe them.
 */
async function produceDeadLetteredMessage(
  queue: IQueueParams,
): Promise<string> {
  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) =>
      cb(new Error('always fails')),
  });

  const producer = await startProducer();
  const [messageId] = await producer.produce(
    RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setBody('dead-letters')
      .setRetryThreshold(0),
  );

  await consumer.run();

  await waitForMessageStatus(messageId, EMessagePropertyStatus.DEAD_LETTERED, {
    timeoutMs: 10_000,
    description: `setup: message ${messageId} reached DEAD_LETTERED`,
  });

  // Shut down both. Neither is needed after this point, and leaving the
  // consumer alive would race the requeue operations. Both shutdowns
  // are idempotent, so the per-test teardown's later attempts are fine.
  await consumer.shutdown();
  await producer.shutdown();

  return messageId;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Requeue from dead-letter list', () => {
  // -------------------------------------------------------------------------
  // First requeue
  // -------------------------------------------------------------------------

  it('creates a new pending message that references the dead-lettered original', async () => {
    const queue = uniqueQueue('requeue-dl');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const originalId = await produceDeadLetteredMessage(queue);

    const messageManager = RedisSMQ.createMessageManager();
    const newMessageId = await messageManager.requeueMessageById(originalId);

    // Distinct IDs. A regression that reused the original's ID would
    // collide in Redis — the original is still in the dead-letter list.
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

    // The original is still in the dead-letter list, with its requeue
    // metadata set. The operation is a copy, not a move.
    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const deadPage = await deadLettered.getMessages(queue, 0, 100);

    expect(deadPage.totalItems).toBe(1);
    expect(deadPage.items).toHaveLength(1);
    expect(deadPage.items[0].id).toBe(originalId);

    const originalState = deadPage.items[0].messageState;
    expect(originalState.requeueCount).toBe(1);

    // `requeuedAt` and `lastRequeuedAt` are both set to the *new*
    // message's `publishedAt` on a first requeue — there is only one
    // requeue event, so first and last coincide.
    expect(originalState.requeuedAt).toBe(requeued.messageState.publishedAt);
    expect(originalState.lastRequeuedAt).toBe(
      requeued.messageState.publishedAt,
    );

    // Aggregate queue metrics: one dead-lettered, one pending.
    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const counts = await queueMessages.countMessagesByStatus(queue);
    expect(counts).toEqual({
      pending: 1,
      acknowledged: 0,
      deadLettered: 1,
      scheduled: 0,
    });
  });

  // -------------------------------------------------------------------------
  // Second requeue
  // -------------------------------------------------------------------------

  it('increments requeueCount and advances lastRequeuedAt on a second requeue', async () => {
    const queue = uniqueQueue('requeue-dl-multiple');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const originalId = await produceDeadLetteredMessage(queue);

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
    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const deadPage = await deadLettered.getMessages(queue, 0, 100);

    expect(deadPage.totalItems).toBe(1);
    const originalState = deadPage.items[0].messageState;

    expect(originalState.requeueCount).toBe(2);
    expect(originalState.requeuedAt).toBe(firstRequeuePublishedAt);
    expect(originalState.lastRequeuedAt).toBe(secondRequeuePublishedAt);
  });
});
