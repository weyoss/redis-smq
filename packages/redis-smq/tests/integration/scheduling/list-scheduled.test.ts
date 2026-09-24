/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { EQueueType, RedisSMQ } from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for reading the scheduled list.
 *
 * `QueueScheduledMessages.getMessages(queue, from, to)` returns a page
 * of scheduled messages along with the total count. The list is stored
 * in a Redis sorted set keyed by the next-fire timestamp, so the
 * iteration order is by score — not by insertion order, and not
 * alphabetically by ID.
 *
 * The tests below establish three contracts:
 *
 *   1. The return shape: `{ totalItems, items }`, with `totalItems`
 *      equal to the number of messages currently scheduled (not just
 *      the page size).
 *
 *   2. The set of items matches the produced messages, with each
 *      message carrying its ID and destination queue.
 *
 *   3. The iteration order matches the score order — the message with
 *      the earliest next-fire timestamp comes first.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Three distinct delays for the produced messages. Deliberately spaced
 * far apart so the score ordering is unambiguous even under the
 * millisecond-level variance in the three `produce` calls' wall-clock
 * timestamps.
 */
const DELAYS_MS = [30_000, 60_000, 90_000] as const;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Listing scheduled messages', () => {
  it('returns the scheduled messages in score order with a consistent count', async () => {
    const queue = uniqueQueue('list-scheduled');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Produce one message per delay, in ascending-delay order. Each
    // produce call returns the new message's ID, which the assertions
    // below compare against the getMessages result.
    const producer = await startProducer();
    const producedIds: string[] = [];

    for (const delay of DELAYS_MS) {
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setQueue(queue)
          .setBody(`delay-${delay}`)
          .setScheduledDelay(delay),
      );
      producedIds.push(id);
    }

    const scheduled = RedisSMQ.createQueueScheduledMessages();

    // The page read. `0, 100` returns every message RedisSMQ has
    // scheduled; three is far below the 100-item cap.
    const page = await scheduled.getMessages(queue, 0, 100);

    // Shape contract: the response carries `totalItems` (the number
    // of scheduled messages in the queue, regardless of page bounds)
    // and `items` (the page's slice). For a single page covering the
    // whole list, the two are equal.
    expect(Object.keys(page).sort()).toEqual(['items', 'totalItems']);
    expect(page.totalItems).toBe(DELAYS_MS.length);
    expect(page.items).toHaveLength(DELAYS_MS.length);

    // Every item carries the expected fields. A regression that
    // returned bare IDs instead of transferable messages — or that
    // dropped a field — would fail here with the specific missing key.
    for (const item of page.items) {
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.destinationQueue).toEqual(queue);
    }

    // The set of IDs matches what was produced. Comparing as a `Set`
    // makes the assertion independent of iteration order, which is
    // also asserted separately below.
    const returnedIds = page.items.map((m) => m.id);
    expect(new Set(returnedIds)).toEqual(new Set(producedIds));

    // Score order matches production order. Because the delays are
    // strictly increasing and far apart, the message with the earliest
    // next-fire timestamp is the first produced, and so on.
    expect(returnedIds).toEqual(producedIds);

    // The count accessor agrees with the page's `totalItems`. Both
    // paths read from the same storage, so a divergence would point at
    // one of the two accessors rather than the state.
    const count = await scheduled.countMessages(queue);
    expect(count).toBe(DELAYS_MS.length);
  });

  it('returns an empty page for a queue with no scheduled messages', async () => {
    const queue = uniqueQueue('list-scheduled-empty');
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const scheduled = RedisSMQ.createQueueScheduledMessages();

    const page = await scheduled.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(0);
    expect(page.items).toEqual([]);

    const count = await scheduled.countMessages(queue);
    expect(count).toBe(0);
  });

  it('reads only the messages for the queried queue', async () => {
    const queueA = uniqueQueue('list-scheduled-a');
    const queueB = uniqueQueue('list-scheduled-b');
    await createQueue(queueA, EQueueType.FIFO_QUEUE);
    await createQueue(queueB, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();
    const [idA] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queueA)
        .setBody('on-a')
        .setScheduledDelay(30_000),
    );
    const [idB] = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queueB)
        .setBody('on-b')
        .setScheduledDelay(60_000),
    );

    const scheduled = RedisSMQ.createQueueScheduledMessages();

    const pageA = await scheduled.getMessages(queueA, 0, 100);
    expect(pageA.totalItems).toBe(1);
    expect(pageA.items).toHaveLength(1);
    expect(pageA.items[0].id).toBe(idA);

    const pageB = await scheduled.getMessages(queueB, 0, 100);
    expect(pageB.totalItems).toBe(1);
    expect(pageB.items).toHaveLength(1);
    expect(pageB.items[0].id).toBe(idB);
  });
});
