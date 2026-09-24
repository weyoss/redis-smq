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
 * Integration test for the produce path.
 *
 * Producing a message takes it from a `ProducibleMessage` (an in-memory
 * builder) to a durable entry in a queue's pending list. The whole round
 * trip is exercised here against a real Redis:
 *
 *   ProducibleMessage → producer.produce() → [id] → pending list → getMessages()
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Producing a message', () => {
  it('returns a single-element tuple containing a string message ID', async () => {
    const queue = uniqueQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();

    const result = await producer.produce(
      RedisSMQ.newProducibleMessage()
        .setQueue(queue)
        .setBody({ hello: 'world' }),
    );

    // The contract is a tuple of length 1, not a bare string. Asserting
    // the shape, not just the element, catches a regression where the
    // return changes to a scalar and every `const [id] = await ...` call
    // site silently reads `undefined`.
    expect(result).toHaveLength(1);
    expect(typeof result[0]).toBe('string');
    expect(result[0].length).toBeGreaterThan(0);
  });

  it('makes the message retrievable from the pending list with its body intact', async () => {
    const queue = uniqueQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();

    const body = { hello: 'world', nested: { ok: true } };
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody(body),
    );

    const pending = RedisSMQ.createQueuePendingMessages();
    const page = await pending.getMessages(queue, 0, 100);

    expect(page.totalItems).toBe(1);
    expect(page.items).toHaveLength(1);
    expect(page.items[0].id).toBe(id);

    // The body must survive the serialize → Redis → deserialize round trip
    // byte-for-byte. A nested object is used deliberately: it would catch
    // a serializer that flatten or drops nested structure.
    expect(page.items[0].body).toEqual(body);

    const count = await pending.countMessages(queue);
    expect(count).toBe(1);
  });

  it('produces distinct IDs for successive messages', async () => {
    const queue = uniqueQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    const producer = await startProducer();

    const ids: string[] = [];
    for (let i = 0; i < 5; i += 1) {
      const [id] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queue).setBody({ seq: i }),
      );
      ids.push(id);
    }

    // All five IDs must be distinct. A collision would mean two messages
    // share a primary key in Redis, which is a data-loss bug — the second
    // write would overwrite the first.
    expect(new Set(ids).size).toBe(ids.length);

    // And all five must actually be in the queue.
    const pending = RedisSMQ.createQueuePendingMessages();
    const count = await pending.countMessages(queue);
    expect(count).toBe(5);
  });

  it('allows a single producer instance to produce multiple messages', async () => {
    const queue = uniqueQueue();
    await createQueue(queue, EQueueType.FIFO_QUEUE);

    // Produce two messages through the same producer instance. The
    // framework must not implicitly close the producer after the first
    // produce — a regression here would pass every test that produces
    // once, and fail in production the moment a caller loops.
    const producer = await startProducer();

    const [first] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody('first'),
    );
    const [second] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody('second'),
    );

    expect(first).not.toBe(second);
    expect(producer.isUp()).toBe(true);
  });
});
