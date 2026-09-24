/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EMessagePropertyStatus,
  EQueueType,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { findById } from '../../helpers/assertions/find-by-id.js';
import { produceAndAck } from '../../helpers/scenarios/message-lifecycle.js';

/**
 * Integration tests for the acknowledged-message audit record.
 *
 * With `messageAudit.acknowledgedMessages` enabled (the test default;
 * see `test-defaults.ts`), RedisSMQ records every successfully
 * processed message in a per-queue acknowledged list. The record is a
 * full `IMessageTransferable`: the producible-message fields (`id`,
 * `body`, `destinationQueue`) plus the message's accumulated state at
 * ack time.
 *
 * The list is read through `QueueAcknowledgedMessages`, which exposes
 * `getMessages` (paginated) and `countMessages`. Both are backed by
 * the same Redis list; a divergence between them points at one of the
 * accessors rather than at the underlying state.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Message audit — acknowledged messages', () => {
  // -------------------------------------------------------------------------
  // Empty queue
  // -------------------------------------------------------------------------

  it('returns an empty list on a fresh queue', async () => {
    const queue = uniqueQueue('audit-ack-empty');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();

    const page = await acknowledged.getMessages(queue, 0, 100);
    expect(page.totalItems).toBe(0);
    expect(page.items).toEqual([]);

    expect(await acknowledged.countMessages(queue)).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Record shape
  // -------------------------------------------------------------------------

  it('records an acknowledged message with the produced fields intact', async () => {
    const queue = uniqueQueue('audit-ack-record');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const [id] = await produceAndAck(queue, 1);
    const body = { seq: 0 };

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const page = await acknowledged.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);

    const record = findById(page.items, id);
    expect(record.id).toBe(id);
    expect(record.body).toEqual(body);
    expect(record.destinationQueue).toEqual(queue);

    // The record's `status` field reflects the state the message was
    // in when the record was written — ACKNOWLEDGED, matching the
    // list the record lives in.
    expect(record.status).toBe(EMessagePropertyStatus.ACKNOWLEDGED);
  });

  it('records the ack state on the message state', async () => {
    const queue = uniqueQueue('audit-ack-state');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const [id] = await produceAndAck(queue, 1);

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const page = await acknowledged.getMessages(queue, 0, 100);
    const record = findById(page.items, id);

    const state = record.messageState;

    // Produce-time stamp.
    expect(typeof state.publishedAt).toBe('number');
    expect(state.publishedAt).toBeGreaterThan(0);

    // Checkout-time stamps. For a single delivery, the two are equal —
    // RedisSMQ writes both in the same Redis script invocation.
    expect(typeof state.processingStartedAt).toBe('number');
    expect(typeof state.lastProcessedAt).toBe('number');
    expect(state.processingStartedAt).toBe(state.lastProcessedAt);

    // Ack-time stamp. Non-null, and not earlier than the checkout
    // (a clock skew would be the only way to violate this; the test
    // assumes no skew).
    expect(typeof state.acknowledgedAt).toBe('number');
    expect(state.acknowledgedAt).toBeGreaterThanOrEqual(
      state.processingStartedAt!,
    );

    // The message never dead-lettered.
    expect(state.deadLetteredAt).toBeNull();

    // One delivery.
    expect(state.attempts).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Multiple messages
  // -------------------------------------------------------------------------

  it('records every acknowledged message in a batch', async () => {
    const queue = uniqueQueue('audit-ack-batch');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const ids = await produceAndAck(queue, 3);

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const page = await acknowledged.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(3);
    expect(page.items).toHaveLength(3);

    const recordedIds = page.items.map((m) => m.id);
    expect(new Set(recordedIds)).toEqual(new Set(ids));

    // Every record carries the ACKNOWLEDGED status — a regression
    // that wrote one record per message but set the status
    // differently for one of them would be caught here even though
    // the ID set matched.
    for (const record of page.items) {
      expect(record.status).toBe(EMessagePropertyStatus.ACKNOWLEDGED);
    }
  });

  // -------------------------------------------------------------------------
  // Accessor agreement
  // -------------------------------------------------------------------------

  it('countMessages, getMessages, and countMessagesByStatus agree', async () => {
    const queue = uniqueQueue('audit-ack-accessors');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    await produceAndAck(queue, 2);

    const acknowledged = RedisSMQ.createQueueAcknowledgedMessages();
    const queueMessages = RedisSMQ.createQueuePublishedMessages();

    const listCount = await acknowledged.countMessages(queue);
    const page = await acknowledged.getMessages(queue, 0, 100);
    const breakdown = await queueMessages.countMessagesByStatus(queue);

    expect(listCount).toBe(2);
    expect(page.totalItems).toBe(listCount);
    expect(breakdown.acknowledged).toBe(listCount);

    // The other buckets are zero — the ack pipeline moved the
    // messages out of pending and did not leave them anywhere else.
    expect(breakdown.pending).toBe(0);
    expect(breakdown.deadLettered).toBe(0);
    expect(breakdown.scheduled).toBe(0);
  });
});
