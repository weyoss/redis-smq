/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import {
  EExchangeQueuePolicy,
  type IExchangeParams,
} from '../../../../src/index.js';
import { createQueue, uniqueQueue } from '../../../helpers/factories/queue.js';
import {
  makeFanoutFixture,
  makeQueues,
  sortQueues,
} from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for the fanout exchange's broadcast semantics.
 *
 * A fanout exchange routes every message to every bound queue. There
 * is no routing key and no binding pattern — the target set is
 * determined entirely by which queues have been bound.
 *
 * `matchQueues(exchange)` is the accessor that reflects this: it takes
 * the exchange as its only argument and returns the complete set of
 * bound queues. RedisSMQ uses this same call internally when a
 * producer publishes through the exchange, so the tests here pin the
 * routing contract that the publishing layer depends on.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeFanout — broadcast', () => {
  // -------------------------------------------------------------------------
  // matchQueues returns the target set
  // -------------------------------------------------------------------------

  describe('matchQueues', () => {
    it('returns an empty list for an exchange with no bound queues', async () => {
      const { exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-broadcast-empty',
      );

      const matched = await exchangeInstance.matchQueues(exchange);
      expect(matched).toEqual([]);
    });

    it('returns the single bound queue for a one-binding exchange', async () => {
      // The simplest positive case. One queue, one binding, one
      // target.
      const { queue, exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-broadcast-single',
      );

      await exchangeInstance.bindQueue(queue, exchange);

      const matched = await exchangeInstance.matchQueues(exchange);
      expect(matched).toEqual([queue]);
    });

    it('returns every bound queue for a multi-binding exchange', async () => {
      const { exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-broadcast-multi',
      );

      const queues = await makeQueues('fan-broadcast-multi-q', 4);

      for (const queue of queues) {
        await exchangeInstance.bindQueue(queue, exchange);
      }

      const matched = await exchangeInstance.matchQueues(exchange);
      expect(sortQueues(matched)).toEqual(sortQueues(queues));
    });

    it('returns the same result on repeated calls when no binding has changed', async () => {
      const { exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-broadcast-repeat',
      );

      const queues = await makeQueues('fan-broadcast-repeat-q', 3);
      for (const queue of queues) {
        await exchangeInstance.bindQueue(queue, exchange);
      }

      const first = await exchangeInstance.matchQueues(exchange);
      const second = await exchangeInstance.matchQueues(exchange);

      expect(sortQueues(first)).toEqual(sortQueues(second));
      expect(sortQueues(first)).toEqual(sortQueues(queues));
    });
  });

  // -------------------------------------------------------------------------
  // Set semantics
  // -------------------------------------------------------------------------

  describe('set semantics', () => {
    it('does not duplicate a queue that has been unbound and re-bound', async () => {
      const { queue, exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-broadcast-rebind',
      );

      await exchangeInstance.bindQueue(queue, exchange);
      await exchangeInstance.unbindQueue(queue, exchange);
      await exchangeInstance.bindQueue(queue, exchange);

      const matched = await exchangeInstance.matchQueues(exchange);
      expect(matched).toEqual([queue]);
    });
  });

  // -------------------------------------------------------------------------
  // Current binding set
  // -------------------------------------------------------------------------

  describe('current binding set', () => {
    it('includes a queue that is bound after an initial match call', async () => {
      const { exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-broadcast-added',
      );

      const [queueA, queueB] = await makeQueues('fan-broadcast-added-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange);

      const initial = await exchangeInstance.matchQueues(exchange);
      expect(initial).toEqual([queueA]);

      // Bind a second queue after the initial lookup.
      await exchangeInstance.bindQueue(queueB, exchange);

      const after = await exchangeInstance.matchQueues(exchange);
      expect(sortQueues(after)).toEqual(sortQueues([queueA, queueB]));
    });

    it('drops a queue that is unbound after an initial match call', async () => {
      const { exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-broadcast-removed',
      );

      const [queueA, queueB] = await makeQueues('fan-broadcast-removed-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange);
      await exchangeInstance.bindQueue(queueB, exchange);

      const initial = await exchangeInstance.matchQueues(exchange);
      expect(sortQueues(initial)).toEqual(sortQueues([queueA, queueB]));

      await exchangeInstance.unbindQueue(queueA, exchange);

      const after = await exchangeInstance.matchQueues(exchange);
      expect(after).toEqual([queueB]);
    });

    it('returns an empty list once the last bound queue is unbound', async () => {
      const { queue, exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-broadcast-emptied',
      );

      await exchangeInstance.bindQueue(queue, exchange);
      await exchangeInstance.unbindQueue(queue, exchange);

      const matched = await exchangeInstance.matchQueues(exchange);
      expect(matched).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // Exchange isolation
  // -------------------------------------------------------------------------

  describe('exchange isolation', () => {
    it('does not leak bindings from one fanout exchange to another', async () => {
      const {
        queue: queueA,
        exchange: exchangeA,
        exchangeInstance,
      } = await makeFanoutFixture('fan-broadcast-iso-a');

      const exchangeB: IExchangeParams = {
        ns: exchangeA.ns,
        name: `ex-b-${Date.now()}`,
      };
      await exchangeInstance.create(exchangeB, EExchangeQueuePolicy.STANDARD);

      const queueB = uniqueQueue('fan-broadcast-iso-b');
      await createQueue(queueB);

      await exchangeInstance.bindQueue(queueA, exchangeA);
      await exchangeInstance.bindQueue(queueB, exchangeB);

      const matchA = await exchangeInstance.matchQueues(exchangeA);
      const matchB = await exchangeInstance.matchQueues(exchangeB);

      expect(matchA).toEqual([queueA]);
      expect(matchB).toEqual([queueB]);
    });

    it('allows the same queue to be a target of multiple fanout exchanges', async () => {
      const {
        queue,
        exchange: exchangeA,
        exchangeInstance,
      } = await makeFanoutFixture('fan-broadcast-shared-queue-a');

      const exchangeB: IExchangeParams = {
        ns: exchangeA.ns,
        name: `ex-shared-${Date.now()}`,
      };
      await exchangeInstance.create(exchangeB, EExchangeQueuePolicy.STANDARD);

      await exchangeInstance.bindQueue(queue, exchangeA);
      await exchangeInstance.bindQueue(queue, exchangeB);

      const matchA = await exchangeInstance.matchQueues(exchangeA);
      const matchB = await exchangeInstance.matchQueues(exchangeB);

      expect(matchA).toEqual([queue]);
      expect(matchB).toEqual([queue]);
    });
  });
});
