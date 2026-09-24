/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import type { ICallback } from 'redis-smq-common';
import {
  EMessagePropertyStatus,
  EQueueType,
  type IMessageTransferable,
  type IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { waitFor } from '../../helpers/assertions/wait-for.js';
import { getConsumer } from '../../helpers/factories/consumer.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { startProducer } from '../../helpers/factories/producer.js';
import { withRedisClient } from '../../helpers/redis/client.js';
import { _getConsumerQueues } from '../../../src/core/consumer/_/_get-consumer-queues.js';
import { _getQueueConsumers } from '../../../src/core/queue-manager/_/_get-queue-consumers.js';

/**
 * Integration tests for a single consumer registered on multiple queues.
 *
 * A consumer's handler set is not limited to one queue. `consume(q1, h1)`
 * followed by `consume(q2, h2)` registers the consumer on both queues, and
 * once `run()` is called the consumer polls both. Messages from either
 * queue arrive at their respective handlers.
 */

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/**
 * Promisified private helpers, bound once at module scope.
 *
 * Both helpers are callback-style:
 *   `_getConsumerQueues(redisClient, consumerId, cb)`
 *   `_getQueueConsumers(redisClient, queue, cb)`
 *
 * `bluebird.promisify` (rather than `node:util.promisify`) is used for
 * consistency with the rest of the codebase.
 */
const getConsumerQueuesAsync = bluebird.promisify(_getConsumerQueues);
const getQueueConsumersAsync = bluebird.promisify(_getQueueConsumers);

/**
 * Acquire a pool client, read the consumer's registered queues from
 * Redis, release. The pairing is repeated in three tests below.
 */
async function consumerQueuesFromRedis(
  consumerId: string,
): Promise<IQueueParams[]> {
  return withRedisClient((client) =>
    getConsumerQueuesAsync(client, consumerId),
  );
}

/**
 * Acquire a pool client, read the queue's registered consumers from
 * Redis, release. Returned as a record keyed by consumer ID — the shape
 * the helper produces.
 */
async function queueConsumersFromRedis(
  queue: IQueueParams,
): Promise<Record<string, unknown>> {
  return withRedisClient((client) => getQueueConsumersAsync(client, queue));
}

/**
 * Sort a list of queue params by `(ns, name)` so comparisons ignore the
 * order RedisSMQ happened to return them in.
 *
 * A handful of assertions need set-equality rather than sequence-equality;
 * sorting makes those comparisons straightforward and produces a diff
 * that a reader can scan line by line.
 */
function sortQueues(queues: IQueueParams[]): IQueueParams[] {
  return [...queues].sort((a, b) =>
    a.ns === b.ns ? a.name.localeCompare(b.name) : a.ns.localeCompare(b.ns),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('A consumer on multiple queues', () => {
  // -------------------------------------------------------------------------
  // Message delivery from each queue
  // -------------------------------------------------------------------------

  describe('message delivery', () => {
    it('delivers messages from every registered queue to the same consumer', async () => {
      const queueA = uniqueQueue('multi-a');
      const queueB = uniqueQueue('multi-b');
      const queueC = uniqueQueue('multi-c');
      await createQueue(queueA, EQueueType.FIFO_QUEUE);
      await createQueue(queueB, EQueueType.FIFO_QUEUE);
      await createQueue(queueC, EQueueType.FIFO_QUEUE);

      // Track which queue each delivery came from. The handler is shared
      // across all three registrations, so distinguishing the deliveries
      // requires reading `msg.destinationQueue` — that's exactly what the
      // test asserts on.
      const received: { queue: string; body: unknown }[] = [];

      const consumer = await getConsumer({ queue: queueA });
      // Replace the default handler from `getConsumer` with one that
      // records the destination queue, then register the other two
      // queues with the same handler.
      await consumer.cancel(queueA);
      const handler = (msg: IMessageTransferable, cb: ICallback) => {
        received.push({
          queue: msg.destinationQueue.name,
          body: msg.body,
        });
        cb();
      };
      await consumer.consume(queueA, handler);
      await consumer.consume(queueB, handler);
      await consumer.consume(queueC, handler);

      const producer = await startProducer();
      const [idA] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queueA).setBody('from-a'),
      );
      const [idB] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queueB).setBody('from-b'),
      );
      const [idC] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queueC).setBody('from-c'),
      );

      await consumer.run();

      // Wait for all three to arrive. The handler pushes to `received` in
      // delivery order, which is not necessarily A, B, C — the consumer
      // polls each queue independently.
      await waitFor(() => received.length === 3, {
        timeoutMs: 10_000,
        description: 'all three queues delivered their message',
      });

      // Sort by queue name so the assertion is on the *set* of deliveries
      // rather than on polling order, which RedisSMQ does not
      // specify.
      const sorted = [...received].sort((a, b) =>
        a.queue.localeCompare(b.queue),
      );

      expect(sorted).toEqual([
        { queue: queueA.name, body: 'from-a' },
        { queue: queueB.name, body: 'from-b' },
        { queue: queueC.name, body: 'from-c' },
      ]);

      // The three IDs must all be distinct — a producer bug that reused
      // an ID would still produce the three deliveries above but would
      // mask a real data-loss issue.
      expect(new Set([idA, idB, idC]).size).toBe(3);
    });

    it('continues to deliver from queues registered after run()', async () => {
      // A consumer's handler set is not frozen at `run()`. This test
      // registers a queue *after* the consumer is running and confirms
      // messages to that queue are still delivered.
      const queueA = uniqueQueue('late-a');
      const queueB = uniqueQueue('late-b');
      await createQueue(queueA, EQueueType.FIFO_QUEUE);
      await createQueue(queueB, EQueueType.FIFO_QUEUE);

      const received: string[] = [];
      const handler = (msg: IMessageTransferable, cb: ICallback) => {
        received.push(msg.destinationQueue.name);
        cb();
      };

      const consumer = await getConsumer({
        queue: queueA,
        messageHandler: handler,
      });
      await consumer.run();

      // Register the second queue while the consumer is running.
      await consumer.consume(queueB, handler);

      const producer = await startProducer();
      const [idA] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queueA).setBody('a'),
      );
      const [idB] = await producer.produce(
        RedisSMQ.newProducibleMessage().setQueue(queueB).setBody('b'),
      );

      await waitFor(() => received.length === 2, {
        timeoutMs: 10_000,
        description: 'both messages delivered',
      });

      // Both messages must be acknowledged, regardless of delivery order.
      // Subscribing to the ack events after the messages are already in
      // flight is a race we avoid by using `expectMessageStatus`-style
      // polling below rather than an event awaiter.
      const manager = RedisSMQ.createMessageManager();
      await waitFor(
        async () => {
          const [a, b] = await Promise.all([
            manager.getMessageStatus(idA),
            manager.getMessageStatus(idB),
          ]);
          return (
            a === EMessagePropertyStatus.ACKNOWLEDGED &&
            b === EMessagePropertyStatus.ACKNOWLEDGED
          );
        },
        { timeoutMs: 5000, description: 'both messages acknowledged' },
      );

      expect(sortedNames(received)).toEqual(
        sortedNames([queueA.name, queueB.name]),
      );
    });
  });

  // -------------------------------------------------------------------------
  // Queue manager's view
  // -------------------------------------------------------------------------

  describe("queue manager's view", () => {
    it('reports the consumer under every queue it is registered on', async () => {
      const queueA = uniqueQueue('view-a');
      const queueB = uniqueQueue('view-b');
      await createQueue(queueA, EQueueType.FIFO_QUEUE);
      await createQueue(queueB, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({ queue: queueA });
      await consumer.consume(queueB, (_msg, cb) => cb());
      await consumer.run();

      // The queue manager reports consumers per queue. The consumer must
      // appear under both.
      const qm = RedisSMQ.createQueueManager();

      await waitFor(
        async () => {
          const consumersOnA = await qm.getConsumers(queueA);
          const consumersOnB = await qm.getConsumers(queueB);
          return (
            consumer.getId() in consumersOnA && consumer.getId() in consumersOnB
          );
        },
        {
          timeoutMs: 5000,
          description: 'consumer registered under both queues',
        },
      );

      // After the wait, re-read once more for the definitive assertion.
      // The waitFor predicate already guaranteed this holds; asserting
      // explicitly produces a clean failure if the state regressed
      // between the predicate and the assertion.
      const consumersOnA = await qm.getConsumers(queueA);
      const consumersOnB = await qm.getConsumers(queueB);
      expect(consumer.getId() in consumersOnA).toBe(true);
      expect(consumer.getId() in consumersOnB).toBe(true);
    });

    it('removes the consumer from only the cancelled queue', async () => {
      const keep = uniqueQueue('keep');
      const drop = uniqueQueue('drop');
      await createQueue(keep, EQueueType.FIFO_QUEUE);
      await createQueue(drop, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({ queue: keep });
      await consumer.consume(drop, (_msg, cb) => cb());
      await consumer.run();

      // Confirm both views show the consumer before cancelling.
      const qm = RedisSMQ.createQueueManager();
      expect(consumer.getId() in (await qm.getConsumers(keep))).toBe(true);
      expect(consumer.getId() in (await qm.getConsumers(drop))).toBe(true);

      await consumer.cancel(drop);

      // Cancel is not always synchronous with respect to the Redis-side
      // bookkeeping, so wait for the drop queue's view to empty before
      // asserting.
      await waitFor(
        async () => Object.keys(await qm.getConsumers(drop)).length === 0,
        {
          timeoutMs: 5000,
          description: 'consumer removed from cancelled queue',
        },
      );

      // The kept queue's view is untouched.
      expect(consumer.getId() in (await qm.getConsumers(keep))).toBe(true);
      expect(Object.keys(await qm.getConsumers(drop))).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Redis-side view (private helpers)
  // -------------------------------------------------------------------------

  describe('Redis-side view', () => {
    it('records the consumer under every registered queue', async () => {
      const queueA = uniqueQueue('redis-a');
      const queueB = uniqueQueue('redis-b');
      await createQueue(queueA, EQueueType.FIFO_QUEUE);
      await createQueue(queueB, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({ queue: queueA });
      await consumer.consume(queueB, (_msg, cb) => cb());
      await consumer.run();

      // _getConsumerQueues returns the consumer's registered queues.
      const queues = await consumerQueuesFromRedis(consumer.getId());

      // Compare ignoring order — RedisSMQ does not specify the
      // sequence these are stored in, and the assertions here are on
      // set membership.
      expect(sortQueues(queues)).toEqual(sortQueues([queueA, queueB]));

      // _getQueueConsumers returns each queue's registered consumers
      // keyed by consumer ID. The consumer must be present in both.
      const consumersOnA = await queueConsumersFromRedis(queueA);
      const consumersOnB = await queueConsumersFromRedis(queueB);
      expect(Object.keys(consumersOnA)).toContain(consumer.getId());
      expect(Object.keys(consumersOnB)).toContain(consumer.getId());
    });

    it('removes the consumer from the Redis view on cancel', async () => {
      const queueA = uniqueQueue('redis-cancel-a');
      const queueB = uniqueQueue('redis-cancel-b');
      await createQueue(queueA, EQueueType.FIFO_QUEUE);
      await createQueue(queueB, EQueueType.FIFO_QUEUE);

      const consumer = await getConsumer({ queue: queueA });
      await consumer.consume(queueB, (_msg, cb) => cb());
      await consumer.run();

      // Confirm the initial state before cancelling — otherwise the
      // post-cancel assertion below is trivially satisfied by a consumer
      // that was never registered in the first place.
      await waitFor(
        async () => {
          const queues = await consumerQueuesFromRedis(consumer.getId());
          return queues.length === 2;
        },
        {
          timeoutMs: 5000,
          description: 'both registrations visible in Redis',
        },
      );

      await consumer.cancel(queueB);

      await waitFor(
        async () => {
          const queues = await consumerQueuesFromRedis(consumer.getId());
          return queues.length === 1 && queues[0].name === queueA.name;
        },
        {
          timeoutMs: 5000,
          description: 'cancelled queue removed from Redis view',
        },
      );

      // Final assertion on the settled state.
      const queues = await consumerQueuesFromRedis(consumer.getId());
      expect(queues).toHaveLength(1);
      expect(queues[0].name).toBe(queueA.name);

      const consumersOnB = await queueConsumersFromRedis(queueB);
      expect(Object.keys(consumersOnB)).toHaveLength(0);

      const consumersOnA = await queueConsumersFromRedis(queueA);
      expect(Object.keys(consumersOnA)).toContain(consumer.getId());
    });
  });
});

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Sort a list of names lexicographically, returning a fresh array.
 * Extracted because it appears in the second delivery test.
 */
function sortedNames(names: string[]): string[] {
  return [...names].sort();
}
