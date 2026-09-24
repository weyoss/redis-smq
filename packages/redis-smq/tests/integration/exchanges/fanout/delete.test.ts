/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { errors, IExchangeParams, RedisSMQ } from '../../../../src/index.js';
import {
  makeFanoutFixture,
  makeQueues,
} from '../../../helpers/factories/exchange.js';
import { randomUUID } from 'node:crypto';

/**
 * Integration tests for deleting a fanout exchange.
 *
 * `delete(exchange)` removes the exchange's bindings from Redis. It is
 * a lifecycle-closing operation: after it succeeds, the exchange is
 * gone and any subsequent operation on it — `matchQueues`,
 * `getRoutingPatterns`, another `delete` — behaves as though the
 * exchange had never existed.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeFanout — delete', () => {
  // -------------------------------------------------------------------------
  // Precondition: no bound queues
  // -------------------------------------------------------------------------

  describe('bound-queue precondition', () => {
    it('rejects with ExchangeHasBoundQueuesError when a queue is still bound', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeFanoutFixture('fan-delete-blocked');

      await exchangeInstance.bindQueue(queue, exchange);

      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeHasBoundQueuesError,
      );

      // The exchange's bindings survived the rejected delete. A
      // regression where RedisSMQ removed the bindings before
      // checking the precondition — leaving a corrupted exchange —
      // would be caught by the match read here.
      const matched = await exchangeInstance.matchQueues(exchange);
      expect(matched).toEqual([queue]);
    });

    it('rejects while at least one queue is still bound, even after another is unbound', async () => {
      const { exchange, exchangeInstance } =
        await makeFanoutFixture('fan-delete-partial');

      const [queueA, queueB] = await makeQueues('fan-delete-partial-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange);
      await exchangeInstance.bindQueue(queueB, exchange);

      // Unbind one queue. The other remains bound.
      await exchangeInstance.unbindQueue(queueA, exchange);

      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeHasBoundQueuesError,
      );

      // The remaining binding is intact.
      const remaining = await exchangeInstance.matchQueues(exchange);
      expect(remaining).toEqual([queueB]);
    });
  });

  // -------------------------------------------------------------------------
  // Successful delete
  // -------------------------------------------------------------------------

  describe('successful delete', () => {
    it('succeeds after every bound queue is unbound', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeFanoutFixture('fan-delete-clean');

      await exchangeInstance.bindQueue(queue, exchange);
      await exchangeInstance.unbindQueue(queue, exchange);

      await expect(exchangeInstance.delete(exchange)).resolves.toBeUndefined();
    });

    it('succeeds after unbinding every queue in a multi-binding exchange', async () => {
      const { exchange, exchangeInstance } =
        await makeFanoutFixture('fan-delete-multi');

      const [queueA, queueB, queueC] = await makeQueues(
        'fan-delete-multi-q',
        3,
      );

      await exchangeInstance.bindQueue(queueA, exchange);
      await exchangeInstance.bindQueue(queueB, exchange);
      await exchangeInstance.bindQueue(queueC, exchange);

      // Unbind two of the three. The delete still refuses.
      await exchangeInstance.unbindQueue(queueA, exchange);
      await exchangeInstance.unbindQueue(queueB, exchange);
      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeHasBoundQueuesError,
      );

      // Unbind the last. The delete now succeeds.
      await exchangeInstance.unbindQueue(queueC, exchange);
      await expect(exchangeInstance.delete(exchange)).resolves.toBeUndefined();
    });

    it('rejects with ExchangeNotFoundError on a lookup after the exchange is deleted', async () => {
      const { queue, exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-delete-empty-match',
      );

      await exchangeInstance.bindQueue(queue, exchange);
      await exchangeInstance.unbindQueue(queue, exchange);
      await exchangeInstance.delete(exchange);

      await expect(exchangeInstance.matchQueues(exchange)).rejects.toThrow(
        errors.ExchangeNotFoundError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Deleting a missing exchange
  // -------------------------------------------------------------------------

  describe('missing exchange', () => {
    it('rejects with ExchangeNotFoundError when the exchange was never created', async () => {
      const exchange: IExchangeParams = {
        ns: 'fan-delete-missing',
        name: `ex-${randomUUID()}`,
      };

      const exchangeInstance = RedisSMQ.createFanoutExchange();
      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeNotFoundError,
      );
    });

    it('rejects with ExchangeNotFoundError on a second delete of the same exchange', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeFanoutFixture('fan-delete-twice');

      await exchangeInstance.bindQueue(queue, exchange);
      await exchangeInstance.unbindQueue(queue, exchange);

      await exchangeInstance.delete(exchange);

      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeNotFoundError,
      );
    });
  });
});
