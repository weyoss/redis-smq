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
import { produceAndDeadLetter } from '../../helpers/scenarios/message-lifecycle.js';

/**
 * Integration tests for the dead-lettered-message audit record.
 *
 * With `messageAudit.deadLetteredMessages` enabled (the test default;
 * see `test-defaults.ts`), RedisSMQ records every dead-lettered
 * message in a per-queue dead-letter list. The record is a full
 * `IMessageTransferable`: the producible-message fields (`id`,
 * `body`, `destinationQueue`) plus the message's accumulated state at
 * dead-letter time.
 *
 * The list is read through `QueueDeadLetteredMessages`, which exposes
 * `getMessages` (paginated) and `countMessages`. Both are backed by
 * the same Redis list; a divergence between them points at one of the
 * accessors rather than at the underlying state.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Message audit — dead-lettered messages', () => {
  // -------------------------------------------------------------------------
  // Empty queue
  // -------------------------------------------------------------------------

  it('returns an empty list on a fresh queue', async () => {
    const queue = uniqueQueue('audit-dl-empty');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();

    const page = await deadLettered.getMessages(queue, 0, 100);
    expect(page.totalItems).toBe(0);
    expect(page.items).toEqual([]);

    expect(await deadLettered.countMessages(queue)).toBe(0);
  });

  // -------------------------------------------------------------------------
  // Record shape
  // -------------------------------------------------------------------------

  it('records a dead-lettered message with the produced fields intact', async () => {
    const queue = uniqueQueue('audit-dl-record');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const [id] = await produceAndDeadLetter(queue, 1);
    const body = { seq: 0 };

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const page = await deadLettered.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);

    const record = findById(page.items, id);
    expect(record.id).toBe(id);
    expect(record.body).toEqual(body);
    expect(record.destinationQueue).toEqual(queue);

    // The record's `status` field reflects the state the message was
    // in when the record was written — DEAD_LETTERED, matching the
    // list the record lives in.
    expect(record.status).toBe(EMessagePropertyStatus.DEAD_LETTERED);
  });

  it('records the dead-letter state on the message state', async () => {
    const queue = uniqueQueue('audit-dl-state');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const [id] = await produceAndDeadLetter(queue, 1);

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const page = await deadLettered.getMessages(queue, 0, 100);
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

    // The message was never acked. This is the field that
    // distinguishes the DL record from the acked record and is the
    // reason this file exists separately from
    // `acknowledged.test.ts`.
    expect(state.acknowledgedAt).toBeNull();

    // DL-time stamp. Non-null, and not earlier than the checkout
    // (a clock skew would be the only way to violate this; the test
    // assumes no skew).
    expect(typeof state.deadLetteredAt).toBe('number');
    expect(state.deadLetteredAt).toBeGreaterThanOrEqual(
      state.processingStartedAt!,
    );

    expect(state.attempts).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Multiple messages
  // -------------------------------------------------------------------------

  it('records every dead-lettered message in a batch', async () => {
    const queue = uniqueQueue('audit-dl-batch');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const ids = await produceAndDeadLetter(queue, 3);

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const page = await deadLettered.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(3);
    expect(page.items).toHaveLength(3);

    const recordedIds = page.items.map((m) => m.id);
    expect(new Set(recordedIds)).toEqual(new Set(ids));

    for (const record of page.items) {
      expect(record.status).toBe(EMessagePropertyStatus.DEAD_LETTERED);
    }
  });

  // -------------------------------------------------------------------------
  // Accessor agreement
  // -------------------------------------------------------------------------

  it('countMessages, getMessages, and countMessagesByStatus agree', async () => {
    const queue = uniqueQueue('audit-dl-accessors');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    await produceAndDeadLetter(queue, 2);

    const deadLettered = RedisSMQ.createQueueDeadLetteredMessages();
    const queueMessages = RedisSMQ.createQueuePublishedMessages();

    const listCount = await deadLettered.countMessages(queue);
    const page = await deadLettered.getMessages(queue, 0, 100);
    const breakdown = await queueMessages.countMessagesByStatus(queue);

    expect(listCount).toBe(2);
    expect(page.totalItems).toBe(listCount);
    expect(breakdown.deadLettered).toBe(listCount);

    // The other buckets are zero — the DL pipeline moved the messages
    // out of pending and did not leave them anywhere else.
    expect(breakdown.pending).toBe(0);
    expect(breakdown.acknowledged).toBe(0);
    expect(breakdown.scheduled).toBe(0);
  });
});
