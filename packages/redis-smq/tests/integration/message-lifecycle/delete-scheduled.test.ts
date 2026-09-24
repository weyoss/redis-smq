/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EQueueType, type IQueueParams, RedisSMQ } from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for deleting scheduled messages.
 *
 * A scheduled message has been produced with a scheduling parameter —
 * `.setScheduledDelay(ms)`, `.setScheduledCRON(expr)`,
 * `.setScheduledRepeat(n)`, or a combination — and has been placed in
 * `keyQueueScheduled` rather than in the pending list. It is not yet
 * eligible for delivery; a worker (`PublishScheduledWorker`) later moves
 * it to pending once the schedule fires.
 *
 * The delete operations are the same as for any other state:
 *
 *     deleteMessageById(id)         — one message
 *     deleteMessagesByIds([...ids]) — several, in a single round trip
 *
 * Both return `{ status, stats }` with the same per-message counters
 * described in `delete-pending.test.ts`. For a scheduled message that
 * exists and is not currently being moved by a worker, `stats` is
 * `{ processed: 1, success: 1, notFound: 0, inProcess: 0 }` and the
 * status is `OK`.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Scheduled delay for the test messages.
 *
 * 60 seconds — long enough that no test or CI hiccup could bring the
 * message close to its delay boundary. The tests never wait for the
 * delay; the message is deleted while it is still scheduled.
 */
const SCHEDULED_DELAY_MS = 60_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Produce a message with a long scheduled delay and shut the producer
 * down.
 *
 * The message lands in `keyQueueScheduled` and stays there because no
 * worker is running to move it. The producer is started and stopped per
 * message — a shared producer would work too, but per-message setup
 * keeps the resource accounting trivial (one producer per test, shut
 * down in the same helper that started it).
 */
async function produceScheduledMessage(queue: IQueueParams): Promise<string> {
  const producer = await startProducer();
  const [messageId] = await producer.produce(
    RedisSMQ.newProducibleMessage()
      .setQueue(queue)
      .setBody('will-be-scheduled')
      .setScheduledDelay(SCHEDULED_DELAY_MS),
  );
  await producer.shutdown();
  return messageId;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Delete scheduled messages by IDs', () => {
  // -------------------------------------------------------------------------
  // Single message by ID
  // -------------------------------------------------------------------------

  it('removes a single scheduled message by ID', async () => {
    const queue = uniqueQueue('delete-sched-single');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const messageId = await produceScheduledMessage(queue);

    // Confirm the message is in the scheduled list before deleting.
    // Without this, a produce that failed to schedule the message would
    // leave the scheduled list empty, and a `notFound: 1` reply would
    // be indistinguishable from a successful delete whose list happened
    // to be empty already.
    const scheduled = RedisSMQ.createQueueScheduledMessages();
    const before = await scheduled.getMessages(queue, 0, 100);
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

    // The message is gone from the scheduled list, and the count
    // reflects it.
    const after = await scheduled.getMessages(queue, 0, 100);
    expect(after.totalItems).toBe(0);
    expect(after.items).toHaveLength(0);

    const count = await scheduled.countMessages(queue);
    expect(count).toBe(0);

    // Aggregate metrics: the message is removed from every bucket. In
    // particular, the `scheduled` count in `countMessagesByStatus`
    // goes to zero.
    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const counts = await queueMessages.countMessagesByStatus(queue);
    expect(counts).toEqual({
      pending: 0,
      acknowledged: 0,
      deadLettered: 0,
      scheduled: 0,
    });
  });

  // -------------------------------------------------------------------------
  // Multiple messages by IDs
  // -------------------------------------------------------------------------

  it('removes several scheduled messages in one call', async () => {
    const queue = uniqueQueue('delete-sched-many');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const id1 = await produceScheduledMessage(queue);
    const id2 = await produceScheduledMessage(queue);

    // Compare as sets. The scheduled list's internal ordering is
    // score-based (the messages' scheduled-at timestamps), and two
    // productions a few milliseconds apart can appear in either order
    // depending on Redis's sorted-set iteration and timestamp
    // resolution. Sorting both sides makes the assertion on membership
    // rather than on incidental ordering.
    const expectedIds = [id1, id2].sort();

    const scheduled = RedisSMQ.createQueueScheduledMessages();
    const before = await scheduled.getMessages(queue, 0, 100);
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

    const after = await scheduled.getMessages(queue, 0, 100);
    expect(after.totalItems).toBe(0);

    const count = await scheduled.countMessages(queue);
    expect(count).toBe(0);

    // Aggregate metrics: the queue's scheduled count is zero and the
    // published-messages total reflects the deletion.
    const queueMessages = RedisSMQ.createQueuePublishedMessages();
    const counts = await queueMessages.countMessagesByStatus(queue);
    expect(counts).toEqual({
      pending: 0,
      acknowledged: 0,
      deadLettered: 0,
      scheduled: 0,
    });

    const total = await queueMessages.countMessages(queue);
    expect(total).toBe(0);
  });
});
