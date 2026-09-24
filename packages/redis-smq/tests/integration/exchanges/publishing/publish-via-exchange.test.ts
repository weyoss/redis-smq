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
  EExchangeQueuePolicy,
  EQueueType,
  errors,
  type IExchangeFanout,
  type IExchangeParams,
  type IExchangeTopic,
  type IQueueParams,
  RedisSMQ,
} from '../../../../src/index.js';
import { consumeOnce } from '../../../helpers/scenarios/consume-once.js';
import { createQueue, uniqueQueue } from '../../../helpers/factories/queue.js';
import { startProducer } from '../../../helpers/factories/producer.js';

/**
 * Integration tests for publishing messages through exchanges.
 *
 * This is the end-to-end test of the exchange routing path: a
 * producer addresses a message to an exchange with a routing key
 * (for direct and topic exchanges) or without one (for fanout), the
 * framework resolves the exchange's bindings, matches the routing key
 * against them, and produces a copy of the message to each target
 * queue. The tests confirm each queue receives a copy by consuming it
 * with `consumeOnce`.
 *
 * THE TWO-LAYER SPLIT:
 *
 *   The exchange sub-folder's sibling files (`direct/`, `topic/`,
 *   `fanout/`) test the *match layer*: `matchQueues(exchange, key)`
 *   returns the correct set of target queues for a given routing key.
 *
 *   This file tests the *publishing layer*: the producer uses the
 *   exchange's match result to determine its targets, produces a copy
 *   to each, and the copy lands in the queue's storage.
 *
 *   A failure here that a sibling match test passes means the
 *   producer's use of the match result is wrong, not the matcher
 *   itself. A failure in both files would point at the matcher. The
 *   split keeps the two diagnoses distinguishable.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface IExchangeFixtures {
  queueA: IQueueParams;
  queueB: IQueueParams;
  queueC: IQueueParams;
  directExchange: IExchangeParams;
  topicExchange: IExchangeParams;
  fanoutExchange: IExchangeParams;
}

/**
 * The three-queue, three-exchange fixture used by nearly every test.
 *
 * Three queues give enough room to distinguish "all queues received"
 * from "only the matched queues received": the direct and topic cases
 * bind two of the three queues and rely on the third being out of
 * scope; the fanout case binds all three.
 *
 * The exchange names are derived from the queues' namespace so the
 * bind operations — which require the queue and exchange to share a
 * namespace — succeed by construction.
 *
 * Every exchange is created before the helper returns. A test that
 * binds a queue to one of these exchanges does not need to call
 * `create` itself; the fixture owns the exchange's lifecycle, and
 * `flushAll` in `beforeEach` tears it down between tests.
 */
async function makeFixtures(): Promise<IExchangeFixtures> {
  const [queueA, queueB, queueC] = await Promise.all([
    createQueue(uniqueQueue('pub-a')),
    createQueue(uniqueQueue('pub-b')),
    createQueue(uniqueQueue('pub-c')),
  ]);

  const ns = queueA.ns;

  const directExchange: IExchangeParams = {
    ns,
    name: `pub-ex-direct-${Date.now()}`,
  };
  const topicExchange: IExchangeParams = {
    ns,
    name: `pub-ex-topic-${Date.now()}`,
  };
  const fanoutExchange: IExchangeParams = {
    ns,
    name: `pub-ex-fanout-${Date.now()}`,
  };

  await Promise.all([
    RedisSMQ.createDirectExchange().create(
      directExchange,
      EExchangeQueuePolicy.STANDARD,
    ),
    RedisSMQ.createTopicExchange().create(
      topicExchange,
      EExchangeQueuePolicy.STANDARD,
    ),
    RedisSMQ.createFanoutExchange().create(
      fanoutExchange,
      EExchangeQueuePolicy.STANDARD,
    ),
  ]);

  return {
    queueA,
    queueB,
    queueC,
    directExchange,
    topicExchange,
    fanoutExchange,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Publishing via exchanges', () => {
  // -------------------------------------------------------------------------
  // Direct exchange
  // -------------------------------------------------------------------------

  describe('direct exchange', () => {
    it('delivers to the queue bound under the exact routing key', async () => {
      const { queueA, queueB, directExchange } = await makeFixtures();
      const exchange = RedisSMQ.createDirectExchange();

      await exchange.bindQueue(queueA, directExchange, 'order.created');
      await exchange.bindQueue(queueB, directExchange, 'order.cancelled');

      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setDirectExchange(directExchange)
          .setExchangeRoutingKey('order.created')
          .setBody({ id: 'A1' }),
      );

      // Both queues are checked concurrently. `consumeOnce` returns
      // the message it consumed, or `null` after the timeout.
      const [a, b] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);

      expect(a).toBeTruthy();
      expect(b).toBeNull();
    });

    it('delivers to every queue bound under the same key', async () => {
      // The fan-out case for a direct exchange: two queues bound
      // under one key. Both receive a copy of the message.
      const { queueA, queueB, directExchange } = await makeFixtures();
      const exchange = RedisSMQ.createDirectExchange();

      await exchange.bindQueue(queueA, directExchange, 'order.created');
      await exchange.bindQueue(queueB, directExchange, 'order.created');

      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setDirectExchange(directExchange)
          .setExchangeRoutingKey('order.created')
          .setBody({ id: 'fan-out' }),
      );

      const [a, b] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);

      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
    });

    it('rejects with NoMatchingQueuesError when the routing key has no bound queues', async () => {
      const { queueA, directExchange } = await makeFixtures();
      const exchange = RedisSMQ.createDirectExchange();

      await exchange.bindQueue(queueA, directExchange, 'order.created');

      const producer = await startProducer();

      await expect(
        producer.produce(
          RedisSMQ.newProducibleMessage()
            .setDirectExchange(directExchange)
            .setExchangeRoutingKey('order.updated')
            .setBody({ id: 'no-match' }),
        ),
      ).rejects.toThrow(errors.NoMatchingQueuesError);
    });
  });

  // -------------------------------------------------------------------------
  // Topic exchange
  // -------------------------------------------------------------------------

  describe('topic exchange', () => {
    it('routes by AMQP wildcard match', async () => {
      const { queueA, queueB, topicExchange } = await makeFixtures();
      const exchange: IExchangeTopic = RedisSMQ.createTopicExchange();

      await exchange.bindQueue(queueA, topicExchange, 'order.*');
      await exchange.bindQueue(queueB, topicExchange, 'order.#');

      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setTopicExchange(topicExchange)
          .setExchangeRoutingKey('order.created')
          .setBody({ id: 'wildcard-match' }),
      );

      const [a, b] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);

      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
    });

    it('delivers only to queues whose patterns match', async () => {
      const { queueA, queueB, topicExchange } = await makeFixtures();
      const exchange: IExchangeTopic = RedisSMQ.createTopicExchange();

      await exchange.bindQueue(queueA, topicExchange, 'payment.*');
      await exchange.bindQueue(queueB, topicExchange, 'order.*');

      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setTopicExchange(topicExchange)
          .setExchangeRoutingKey('order.created')
          .setBody({ id: 'single-match' }),
      );

      const [a, b] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);

      expect(a).toBeNull();
      expect(b).toBeTruthy();
    });

    it('produces exactly one copy per matching queue even when multiple patterns match', async () => {
      const { queueA, topicExchange } = await makeFixtures();
      const exchange: IExchangeTopic = RedisSMQ.createTopicExchange();

      await exchange.bindQueue(queueA, topicExchange, 'order.*');
      await exchange.bindQueue(queueA, topicExchange, 'order.#');
      await exchange.bindQueue(queueA, topicExchange, 'order.created');

      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setTopicExchange(topicExchange)
          .setExchangeRoutingKey('order.created')
          .setBody({ id: 'dedup' }),
      );

      // First consume: should find the message.
      const first = await consumeOnce(queueA);
      expect(first).toBeTruthy();

      // Second consume: should time out — the queue is empty.
      const second = await consumeOnce(queueA, { timeoutMs: 1000 });
      expect(second).toBeNull();
    });

    it('rejects with NoMatchingQueuesError when no pattern matches the routing key', async () => {
      const { queueA, topicExchange } = await makeFixtures();
      const exchange: IExchangeTopic = RedisSMQ.createTopicExchange();

      await exchange.bindQueue(queueA, topicExchange, 'payment.*');

      const producer = await startProducer();

      await expect(
        producer.produce(
          RedisSMQ.newProducibleMessage()
            .setTopicExchange(topicExchange)
            .setExchangeRoutingKey('order.created')
            .setBody({ id: 'no-topic-match' }),
        ),
      ).rejects.toThrow(errors.NoMatchingQueuesError);
    });
  });

  // -------------------------------------------------------------------------
  // Fanout exchange
  // -------------------------------------------------------------------------

  describe('fanout exchange', () => {
    it('delivers to every bound queue regardless of routing key', async () => {
      const { queueA, queueB, queueC, fanoutExchange } = await makeFixtures();
      const exchange: IExchangeFanout = RedisSMQ.createFanoutExchange();

      await exchange.bindQueue(queueA, fanoutExchange);
      await exchange.bindQueue(queueB, fanoutExchange);
      await exchange.bindQueue(queueC, fanoutExchange);

      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setFanoutExchange(fanoutExchange)
          .setBody({ id: 'broadcast' }),
      );

      const [a, b, c] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
        consumeOnce(queueC),
      ]);

      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
      expect(c).toBeTruthy();
    });

    it('delivers only to the queues that are bound', async () => {
      const { queueA, queueB, queueC, fanoutExchange } = await makeFixtures();
      const exchange: IExchangeFanout = RedisSMQ.createFanoutExchange();

      await exchange.bindQueue(queueA, fanoutExchange);
      await exchange.bindQueue(queueB, fanoutExchange);
      // queueC is deliberately not bound.

      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setFanoutExchange(fanoutExchange)
          .setBody({ id: 'partial-broadcast' }),
      );

      const [a, b, c] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
        consumeOnce(queueC),
      ]);

      expect(a).toBeTruthy();
      expect(b).toBeTruthy();
      expect(c).toBeNull();
    });

    it('rejects with NoMatchingQueuesError when no queue is bound', async () => {
      const { fanoutExchange } = await makeFixtures();
      const producer = await startProducer();

      await expect(
        producer.produce(
          RedisSMQ.newProducibleMessage()
            .setFanoutExchange(fanoutExchange)
            .setBody({ id: 'no-targets' }),
        ),
      ).rejects.toThrow(errors.NoMatchingQueuesError);
    });
  });

  // -------------------------------------------------------------------------
  // Namespace isolation
  // -------------------------------------------------------------------------

  describe('namespace isolation', () => {
    it('does not deliver to a queue in a different namespace', async () => {
      const nsA = `pub-iso-a-${Date.now()}`;
      const nsB = `pub-iso-b-${Date.now()}`;
      const exchangeName = 'shared-exchange-name';

      const queueA = uniqueQueue('pub-iso-qa');
      queueA.ns = nsA;
      await createQueue(queueA, EQueueType.FIFO_QUEUE);

      const queueB = uniqueQueue('pub-iso-qb');
      queueB.ns = nsB;
      await createQueue(queueB, EQueueType.FIFO_QUEUE);

      const exchangeA: IExchangeParams = { ns: nsA, name: exchangeName };
      const exchangeB: IExchangeParams = { ns: nsB, name: exchangeName };

      const exchange = RedisSMQ.createDirectExchange();
      await exchange.create(exchangeA, EExchangeQueuePolicy.STANDARD);
      await exchange.create(exchangeB, EExchangeQueuePolicy.STANDARD);

      await exchange.bindQueue(queueA, exchangeA, 'iso.key');
      await exchange.bindQueue(queueB, exchangeB, 'iso.key');

      const producer = await startProducer();
      await producer.produce(
        RedisSMQ.newProducibleMessage()
          .setDirectExchange(exchangeA)
          .setExchangeRoutingKey('iso.key')
          .setBody({ id: 'namespace-a' }),
      );

      const [a, b] = await Promise.all([
        consumeOnce(queueA),
        consumeOnce(queueB),
      ]);

      expect(a).toBeTruthy();
      expect(b).toBeNull();
    });
  });
});
