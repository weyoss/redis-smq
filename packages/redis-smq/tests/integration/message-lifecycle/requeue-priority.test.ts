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
import { findById } from '../../helpers/assertions/find-by-id.js';

/**
 * Integration tests for requeuing a message on a priority queue.
 *
 * A priority queue stores its pending messages in a Redis sorted set
 * (`keyQueuePriority`), scored by the message's priority level. A FIFO
 * or LIFO queue stores them in a plain list (`keyQueuePending`). The
 * two are separate keys read by different dequeue paths.
 *
 * Requeuing a priority message therefore has a stricter contract than
 * requeuing a FIFO message: the new message must land in the *priority*
 * storage with the *same* priority the original carried. A requeue that
 * dropped the priority would either:
 *
 *   - Write to `keyQueuePending` instead, which the priority queue's
 *     dequeue loop does not read — the message would be silently lost.
 *
 *   - Write to `keyQueuePriority` with `priority: null`, which would
 *     collide with RedisSMQ's ordering assumptions and could place
 *     the message at an unpredictable position.
 *
 * Neither failure is visible from a plain "the message is in the
 * pending list" assertion, because the pending-list reader may
 * normalize over both storages. The tests below therefore assert on the
 * priority value itself, which is the field the storage decision is
 * derived from.
 */

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

/**
 * The priority used by the tests.
 *
 * `ABOVE_NORMAL` rather than `HIGHEST` so that the assertion is on a
 * value that is neither the top nor the bottom of the range — a bug
 * that clamped or defaulted would be more likely to produce one of
 * those extremes.
 */
const TEST_PRIORITY = EMessagePriority.ABOVE_NORMAL;

/**
 * Produce a message with a priority and drive it to the acknowledged
 * state.
 *
 * A consumer that acks immediately delivers on the first attempt, so
 * no retry pipeline is involved. The consumer is shut down before
 * returning — a live consumer would pick up the requeued message and
 * move it out of the pending storage before the test could observe it.
 */
async function produceAcknowledgedPriorityMessage(
  queue: IQueueParams,
): Promise<string> {
  const consumer = await getConsumer({
    queue,
    messageHandler: (_msg: IMessageTransferable, cb: ICallback) => cb(),
  });

  const producer = await startProducer();
  const [messageId] = await producer.produce(
    RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setPriority(TEST_PRIORITY)
      .setBody('priority-requeue'),
  );

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

describe('Requeue on a priority queue', () => {
  // -------------------------------------------------------------------------
  // First requeue
  // -------------------------------------------------------------------------

  it('preserves the priority on the requeued message', async () => {
    const queue = uniqueQueue('requeue-prio');
    await createQueue(queue, EQueueType.PRIORITY_QUEUE);

    const originalId = await produceAcknowledgedPriorityMessage(queue);

    const messageManager = RedisSMQ.createMessageManager();
    const newMessageId = await messageManager.requeueMessageById(originalId);

    // Distinct IDs. The original remains in the acknowledged list; the
    // new message is a fresh entry in the priority queue's storage.
    expect(newMessageId).not.toBe(originalId);

    // The requeued message is on the same priority queue and still
    // carries the original priority. This is the primary assertion of
    // the file: a requeue that dropped the priority would place the
    // message at the wrong storage key or at an unpredictable position
    // within the sorted set, and neither `id` nor `destinationQueue`
    // would reveal the bug.
    const pending = RedisSMQ.createQueuePendingMessages();
    const pendingPage = await pending.getMessages(queue, 0, 100);

    expect(pendingPage.totalItems).toBe(1);
    expect(pendingPage.items).toHaveLength(1);

    const requeued = pendingPage.items[0];
    expect(requeued.id).toBe(newMessageId);
    expect(requeued.destinationQueue).toEqual(queue);
    expect(requeued.priority).toBe(TEST_PRIORITY);
    expect(requeued.messageState.requeuedMessageParentId).toBe(originalId);

    // The new message carries a real `publishedAt` — RedisSMQ
    // stamps it during requeue, and the assertions below compare
    // against it.
    expect(typeof requeued.messageState.publishedAt).toBe('number');
    expect(requeued.messageState.publishedAt).toBeGreaterThan(0);

    // The original is still in the acknowledged list, with its requeue
    // metadata set. The operation is a copy, not a move. The original
    // also retains its priority.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const ackPage = await acknowledged.getMessages(queue, 0, 100);

    expect(ackPage.totalItems).toBe(1);
    expect(ackPage.items).toHaveLength(1);
    expect(ackPage.items[0].id).toBe(originalId);
    expect(ackPage.items[0].priority).toBe(TEST_PRIORITY);

    const originalState = ackPage.items[0].messageState;
    expect(originalState.requeueCount).toBe(1);
    expect(originalState.requeuedAt).toBe(requeued.messageState.publishedAt);
    expect(originalState.lastRequeuedAt).toBe(
      requeued.messageState.publishedAt,
    );

    // Aggregate queue metrics: one acknowledged, one pending.
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

  it('preserves the priority on each requeued copy after multiple requeues', async () => {
    const queue = uniqueQueue('requeue-prio-multiple');
    await createQueue(queue, EQueueType.PRIORITY_QUEUE);

    const originalId = await produceAcknowledgedPriorityMessage(queue);

    const messageManager = RedisSMQ.createMessageManager();

    // First requeue. Capture the new message's `publishedAt` — it will
    // become the original's `requeuedAt`.
    const firstRequeueId = await messageManager.requeueMessageById(originalId);

    const pending = RedisSMQ.createQueuePendingMessages();
    const afterFirst = await pending.getMessages(queue, 0, 100);
    expect(afterFirst.items).toHaveLength(1);

    const firstRequeue = afterFirst.items[0];
    expect(firstRequeue.id).toBe(firstRequeueId);
    expect(firstRequeue.priority).toBe(TEST_PRIORITY);
    const firstRequeuePublishedAt = firstRequeue.messageState.publishedAt;
    expect(typeof firstRequeuePublishedAt).toBe('number');

    // Gap between requeues so the two published timestamps differ.
    // Without this, both requeues could land in the same millisecond on
    // a fast machine, and the `not.toBe` comparison below would fail
    // for a reason unrelated to RedisSMQ.
    await new Promise((resolve) => setTimeout(resolve, 5));

    // Second requeue: same original, new message.
    const secondRequeueId = await messageManager.requeueMessageById(originalId);

    expect(secondRequeueId).not.toBe(firstRequeueId);
    expect(secondRequeueId).not.toBe(originalId);

    const afterSecond = await pending.getMessages(queue, 0, 100);
    expect(afterSecond.totalItems).toBe(2);

    // Both requeued messages carry the original priority and reference
    // the same original. If RedisSMQ tracked the parent across
    // requeues by chaining (the second requeue pointing at the first
    // requeue's message), the parent assertions would fail here.
    for (const msg of afterSecond.items) {
      expect(msg.priority).toBe(TEST_PRIORITY);
      expect(msg.messageState.requeuedMessageParentId).toBe(originalId);
    }

    const secondRequeue = findById(afterSecond.items, secondRequeueId);
    const secondRequeuePublishedAt = secondRequeue.messageState.publishedAt;
    expect(typeof secondRequeuePublishedAt).toBe('number');
    expect(secondRequeuePublishedAt).not.toBe(firstRequeuePublishedAt);

    // The original's state has advanced; `requeuedAt` is still the
    // first requeue's timestamp, `lastRequeuedAt` is the second's. The
    // original still has its priority.
    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const ackPage = await acknowledged.getMessages(queue, 0, 100);

    expect(ackPage.totalItems).toBe(1);
    const original = ackPage.items[0];
    expect(original.priority).toBe(TEST_PRIORITY);

    const originalState = original.messageState;
    expect(originalState.requeueCount).toBe(2);
    expect(originalState.requeuedAt).toBe(firstRequeuePublishedAt);
    expect(originalState.lastRequeuedAt).toBe(secondRequeuePublishedAt);
  });
});
