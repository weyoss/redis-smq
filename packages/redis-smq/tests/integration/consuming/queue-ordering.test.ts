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
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';

/**
 * Integration tests for intra-queue message ordering.
 *
 * The queue type controls the order in which messages are handed to a
 * consumer:
 *
 *   - `FIFO_QUEUE` — first in, first out. A message produced earlier is
 *     delivered earlier.
 *   - `LIFO_QUEUE` — last in, first out. A message produced later is
 *     delivered earlier.
 *
 * Both are *per-queue* guarantees. A consumer registered on two queues
 * sees each queue's order preserved independently; the interleaving
 * between the two queues is unspecified.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Message count for the single-queue ordering tests. See the file header
 * for why this value.
 */
const TOTAL = 100;

/**
 * Message count for the mixed-queue test. Smaller because the test is
 * about *independence* of ordering, not about throughput — the interleaving
 * of two 10-message streams is enough to catch a cross-queue
 * contamination bug (which would need the two queues' messages to be
 * distinguishable, not numerous).
 */
const MIXED_TOTAL = 10;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Produce `count` messages to `queue`, sequentially awaited.
 *
 * Sequential production is deliberate: the ordering assertion compares
 * the delivery order against the *production* order, and concurrent
 * production would make that order undefined. RedisSMQ assigns
 * message IDs at produce time, so the returned array is the ground truth
 * for "what order did the producer submit messages in".
 */
async function produceSequentially(
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

/**
 * A consumer paired with the IDs of the messages its handler has seen,
 * in delivery order.
 */
interface ITrackedConsumer {
  consumer: Awaited<ReturnType<typeof getConsumer>>;
  received: string[];
}

/**
 * Register a consumer on `queue` whose handler records every message ID
 * in delivery order, then acks the message.
 *
 * The handler acks on entry, which is what makes the ordering assertion
 * well-defined: without an ack, RedisSMQ would requeue the message
 * after a consume-timeout and deliver it again, producing a second entry
 * in `received` and defeating the length check.
 */
async function createTrackingConsumer(
  queue: string | IQueueParams,
): Promise<ITrackedConsumer> {
  const received: string[] = [];
  const consumer = await getConsumer({
    queue,
    messageHandler: (msg: IMessageTransferable, cb: ICallback) => {
      received.push(msg.id);
      cb();
    },
  });
  return { consumer, received };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Queue ordering', () => {
  // -------------------------------------------------------------------------
  // FIFO
  // -------------------------------------------------------------------------

  describe('FIFO queues', () => {
    it('delivers messages in the order they were produced', async () => {
      const queue = uniqueQueue('fifo');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const producedIds = await produceSequentially(queue, TOTAL);

      const { consumer, received } = await createTrackingConsumer(queue);
      await consumer.run();

      await waitFor(() => received.length === TOTAL, {
        timeoutMs: 30_000,
        description: `all ${TOTAL} FIFO messages delivered`,
      });

      // Full array equality: length, membership, and order in one
      // assertion. A failure shows the first divergence with context.
      expect(received).toEqual(producedIds);
    });
  });

  // -------------------------------------------------------------------------
  // LIFO
  // -------------------------------------------------------------------------

  describe('LIFO queues', () => {
    it('delivers messages in reverse order of production', async () => {
      const queue = uniqueQueue('lifo');
      await createQueue(queue, EQueueType.LIFO_QUEUE);

      const producedIds = await produceSequentially(queue, TOTAL);

      const { consumer, received } = await createTrackingConsumer(queue);
      await consumer.run();

      await waitFor(() => received.length === TOTAL, {
        timeoutMs: 30_000,
        description: `all ${TOTAL} LIFO messages delivered`,
      });

      // Reversed comparison against production order — the last produced
      // message is the first delivered.
      expect(received).toEqual([...producedIds].reverse());
    });
  });

  // -------------------------------------------------------------------------
  // Independence across queue types
  // -------------------------------------------------------------------------

  describe('independent ordering across queue types', () => {
    it("preserves each queue's ordering independently on a shared consumer", async () => {
      const fifoQueue = uniqueQueue('mixed-fifo');
      const lifoQueue = uniqueQueue('mixed-lifo');
      await createQueue(fifoQueue, EQueueType.FIFO_QUEUE);
      await createQueue(lifoQueue, EQueueType.LIFO_QUEUE);

      // Interleave production across the two queues. The interleaving is
      // deliberate: if production were "all FIFO then all LIFO", a bug
      // that drained one queue before starting the other would produce
      // the same delivery pattern as correct behavior, and the test would
      // pass for the wrong reason.
      const producer = await startProducer();
      const producedFifo: string[] = [];
      const producedLifo: string[] = [];

      for (let i = 0; i < MIXED_TOTAL; i += 1) {
        const [fifoId] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(fifoQueue)
            .setBody({ seq: i, target: 'fifo' }),
        );
        producedFifo.push(fifoId);

        const [lifoId] = await producer.produce(
          RedisSMQ.newProducibleMessage()
            .setQueue(lifoQueue)
            .setBody({ seq: i, target: 'lifo' }),
        );
        producedLifo.push(lifoId);
      }

      // Track deliveries per queue. The handler is shared across both
      // registrations, and `msg.destinationQueue` is what identifies
      // which queue each delivery came from.
      const receivedFifo: string[] = [];
      const receivedLifo: string[] = [];

      const consumer = await getConsumer({
        queue: fifoQueue,
        messageHandler: (msg: IMessageTransferable, cb: ICallback) => {
          if (msg.destinationQueue.name === fifoQueue.name) {
            receivedFifo.push(msg.id);
          } else if (msg.destinationQueue.name === lifoQueue.name) {
            receivedLifo.push(msg.id);
          }
          cb();
        },
      });
      await consumer.consume(lifoQueue, (msg, cb) => {
        // The second `consume` call needs its own handler reference —
        // RedisSMQ does not share handlers across registrations
        // on different queues. See `consumer-registration.test.ts` for
        // the registration mechanics.
        if (msg.destinationQueue.name === fifoQueue.name) {
          receivedFifo.push(msg.id);
        } else if (msg.destinationQueue.name === lifoQueue.name) {
          receivedLifo.push(msg.id);
        }
        cb();
      });

      await consumer.run();

      await waitFor(
        () =>
          receivedFifo.length === MIXED_TOTAL &&
          receivedLifo.length === MIXED_TOTAL,
        {
          timeoutMs: 15_000,
          description: `both queues delivered all ${MIXED_TOTAL} messages`,
        },
      );

      // FIFO: production order preserved.
      expect(receivedFifo).toEqual(producedFifo);

      // LIFO: production order reversed.
      expect(receivedLifo).toEqual([...producedLifo].reverse());
    });
  });
});
