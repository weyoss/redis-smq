/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import type { ICallback } from 'redis-smq-common';
import {
  EMessagePropertyStatus,
  EQueueType,
  type IConsumer,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitForMessageStatus } from '../../helpers/assertions/message-status.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { createBareConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for multiplexed consumers.
 *
 * A consumer built with `enableMultiplexing: true` uses a single shared
 * poller for all its registered queues, instead of spawning one worker per
 * queue. This changes the timing of message delivery but not the
 * user-visible contract:
 *
 *   - Messages produced to any registered queue reach the handler.
 *   - Registration works the same before and after `run()`.
 *   - `cancel(queue)` stops delivery from that queue without affecting
 *     the others.
 *   - Re-registration after cancel works.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * A record of a multiplexed consumer and the messages it has received
 * across all its registered queues.
 *
 * The array is filled by the shared handler. Since the consumer polls
 * all queues through one poller, the order messages arrive in is not
 * necessarily the order they were produced — the tests below assert on
 * set-equality or wait for a total count rather than on sequence.
 */
interface ITrackedMultiplexedConsumer {
  consumer: IConsumer;
  received: IMessageTransferable[];
}

/**
 * Create a bare multiplexed consumer whose handler records every
 * delivery.
 *
 * The handler acks each message on entry, so the queue does not re-deliver
 * it later and inflate the tracking array. The message's destination
 * queue is available via `msg.destinationQueue`, which is what the tests
 * use to attribute deliveries to queues.
 */
async function createTrackedMultiplexedConsumer(
  queues: (string | IQueueParams)[],
): Promise<ITrackedMultiplexedConsumer> {
  const received: IMessageTransferable[] = [];
  const consumer = createBareConsumer({ enableMultiplexing: true });

  const handler = (msg: IMessageTransferable, cb: ICallback) => {
    received.push(msg);
    cb();
  };

  for (const queue of queues) {
    await consumer.consume(queue, handler);
  }

  return { consumer, received };
}

/**
 * Produce `count` messages to a queue and return their IDs.
 *
 * Extracted because four tests in this file need "produce a batch to a
 * queue" and the boilerplate — newProducibleMessage, setQueue, setBody,
 * await produce, push id — adds up.
 */
async function produceBatch(
  queue: IQueueParams,
  count: number,
): Promise<string[]> {
  const producer = await startProducer();
  const ids: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const [id] = await producer.produce(
      RedisSMQ.newProducibleMessage().setQueue(queue).setBody({ seq: i }),
    );
    ids.push(id);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Multiplexed consumer', () => {
  // -------------------------------------------------------------------------
  // Delivery
  // -------------------------------------------------------------------------

  describe('delivery', () => {
    it('delivers messages from all registered queues to one shared handler', async () => {
      const queueA = uniqueQueue('multi-a');
      const queueB = uniqueQueue('multi-b');
      const queueC = uniqueQueue('multi-c');
      await createQueue(queueA, EQueueType.FIFO_QUEUE);
      await createQueue(queueB, EQueueType.FIFO_QUEUE);
      await createQueue(queueC, EQueueType.FIFO_QUEUE);

      // Register all three before run, then produce to each. The consumer
      // must deliver all three to the shared handler; the destination
      // queue is what distinguishes them.
      const { consumer, received } = await createTrackedMultiplexedConsumer([
        queueA,
        queueB,
        queueC,
      ]);

      const [idA] = await produceBatch(queueA, 1);
      const [idB] = await produceBatch(queueB, 1);
      const [idC] = await produceBatch(queueC, 1);

      await consumer.run();

      await waitFor(() => received.length === 3, {
        timeoutMs: 10_000,
        description: 'all three queues delivered their message',
      });

      // Attribute each delivery to a queue and assert on the set of
      // (queue, id) pairs. Sorting makes the comparison order-independent
      // since the shared poller does not guarantee queue visitation order.
      const pairs = received
        .map((m) => ({ queue: m.destinationQueue.name, id: m.id }))
        .sort((a, b) => a.queue.localeCompare(b.queue));

      expect(pairs).toEqual(
        [
          { queue: queueA.name, id: idA },
          { queue: queueB.name, id: idB },
          { queue: queueC.name, id: idC },
        ].sort((a, b) => a.queue.localeCompare(b.queue)),
      );
    });

    it('accepts new queue registrations while running', async () => {
      // Registration is not frozen at `run()`. A queue registered while
      // the multiplexed consumer is already running must start receiving
      // deliveries on the next poll tick.
      const queueA = uniqueQueue('late-a');
      const queueB = uniqueQueue('late-b');
      await createQueue(queueA, EQueueType.FIFO_QUEUE);
      await createQueue(queueB, EQueueType.FIFO_QUEUE);

      const { consumer, received } = await createTrackedMultiplexedConsumer([
        queueA,
      ]);

      await consumer.run();

      // Register queueB after the consumer has started.
      await consumer.consume(queueB, (msg, cb) => {
        received.push(msg);
        cb();
      });

      const [idA] = await produceBatch(queueA, 1);
      const [idB] = await produceBatch(queueB, 1);

      await waitFor(() => received.length === 2, {
        timeoutMs: 10_000,
        description: 'both messages delivered after late registration',
      });

      const ids = received.map((m) => m.id).sort();
      expect(ids).toEqual([idA, idB].sort());
    });
  });

  // -------------------------------------------------------------------------
  // Cancellation
  // -------------------------------------------------------------------------

  describe('cancellation', () => {
    it('stops delivering from a cancelled queue without affecting others', async () => {
      const keep = uniqueQueue('keep');
      const drop = uniqueQueue('drop');
      await createQueue(keep, EQueueType.FIFO_QUEUE);
      await createQueue(drop, EQueueType.FIFO_QUEUE);

      const { consumer, received } = await createTrackedMultiplexedConsumer([
        keep,
        drop,
      ]);

      await consumer.run();

      await consumer.cancel(drop);

      // Produce to both. Only the kept queue's message must be delivered.
      await produceBatch(keep, 1);
      await produceBatch(drop, 1);

      // Wait for the kept queue's message.
      await waitFor(() => received.length === 1, {
        timeoutMs: 5000,
        description: 'kept queue delivered its message',
      });

      // Settle window: give the cancelled queue's message time to be
      // erroneously delivered if the cancel failed to take effect. A
      // correct cancel leaves the message pending forever (no consumer
      // polls it), so no delivery arrives in this window.
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(received).toHaveLength(1);
      expect(received[0].destinationQueue.name).toBe(keep.name);

      // The cancelled queue's message must still be pending — it was not
      // consumed by anyone, and no ack should have occurred.
      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(drop)).toBe(1);
    });

    it('allows registering a new queue after cancelling another', async () => {
      // The composite flow: register two, cancel one, register a third.
      // Verifies that the internal handler set is properly maintained —
      // a bug that left a stale entry on cancel would either duplicate
      // handlers or block new registrations.
      const q1 = uniqueQueue('q1');
      const q2 = uniqueQueue('q2');
      const q3 = uniqueQueue('q3');
      await createQueue(q1, EQueueType.FIFO_QUEUE);
      await createQueue(q2, EQueueType.FIFO_QUEUE);
      await createQueue(q3, EQueueType.FIFO_QUEUE);

      const { consumer, received } = await createTrackedMultiplexedConsumer([
        q1,
        q2,
      ]);

      await consumer.run();

      await consumer.cancel(q2);
      await consumer.consume(q3, (msg, cb) => {
        received.push(msg);
        cb();
      });

      // Produce to all three. Only q1 and q3 are registered; q2's
      // message must stay pending.
      const [id1] = await produceBatch(q1, 1);
      const [id2] = await produceBatch(q2, 1);
      const [id3] = await produceBatch(q3, 1);

      await waitFor(() => received.length === 2, {
        timeoutMs: 10_000,
        description: 'q1 and q3 delivered, q2 not polled',
      });

      const receivedIds = received.map((m) => m.id).sort();
      expect(receivedIds).toEqual([id1, id3].sort());
      expect(receivedIds).not.toContain(id2);

      // q2's message remains pending.
      const pending = RedisSMQ.createQueuePendingMessages();
      expect(await pending.countMessages(q2)).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Timing characteristic
  // -------------------------------------------------------------------------

  describe('timing', () => {
    it('processes a batch of messages within the multiplexed tick interval', async () => {
      const queue = uniqueQueue('timing');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const { consumer, received } = await createTrackedMultiplexedConsumer([
        queue,
      ]);

      const BATCH = 5;
      const ids = await produceBatch(queue, BATCH);

      const start = Date.now();
      await consumer.run();

      // waitFor with a generous timeout
      await waitFor(() => received.length === BATCH, {
        timeoutMs: 15_000,
        description: 'all messages delivered within extended timeout',
      });

      const elapsed = Date.now() - start;

      // Every message must have reached ACKNOWLEDGED. Since the handler
      // acks on entry, this is a state-level confirmation that the
      // deliveries were durably processed, not merely handed off.
      for (const id of ids) {
        await waitForMessageStatus(id, EMessagePropertyStatus.ACKNOWLEDGED);
      }

      expect(
        elapsed,
        `expected ${BATCH} multiplexed messages to process within 8s ` +
          `(one tick per message), took ${elapsed}ms`,
      ).toBeLessThan(8000);
    });
  });
});
