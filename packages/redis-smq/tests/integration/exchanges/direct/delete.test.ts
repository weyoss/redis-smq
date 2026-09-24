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
import { createQueue, uniqueQueue } from '../../../helpers/factories/queue.js';
import { makeDirectFixture } from '../../../helpers/factories/exchange.js';
import { randomUUID } from 'node:crypto';

/**
 * Integration tests for deleting a direct exchange.
 *
 * `delete(exchange)` removes the exchange's bindings from Redis. It is
 * a lifecycle-closing operation: after it succeeds, the exchange is
 * gone and any subsequent operation on it — `matchQueues`,
 * `getRoutingKeys`, another `delete` — behaves as though the exchange
 * had never existed.
 */

/**
 * A routing key that passes the direct-exchange validator.
 */
const ROUTING_KEY = 'test.key';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeDirect — delete', () => {
  // -------------------------------------------------------------------------
  // Precondition: no bound queues
  // -------------------------------------------------------------------------

  describe('bound-queue precondition', () => {
    it('rejects with ExchangeHasBoundQueuesError when a queue is still bound', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeDirectFixture('dir-delete-blocked');

      await exchangeInstance.bindQueue(queue, exchange, ROUTING_KEY);

      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeHasBoundQueuesError,
      );

      // The exchange's bindings survived the rejected delete. A
      // regression where RedisSMQ removed the bindings before
      // checking the precondition — leaving a corrupted exchange —
      // would be caught by the match read here.
      const matched = await exchangeInstance.matchQueues(exchange, ROUTING_KEY);
      expect(matched).toEqual([queue]);
    });

    it('rejects while at least one queue is still bound, even after another is unbound', async () => {
      const { exchange, exchangeInstance } =
        await makeDirectFixture('dir-delete-partial');

      const queueA = uniqueQueue('dir-delete-partial-a');
      await createQueue(queueA);
      const queueB = uniqueQueue('dir-delete-partial-b');
      await createQueue(queueB);

      await exchangeInstance.bindQueue(queueA, exchange, 'key.a');
      await exchangeInstance.bindQueue(queueB, exchange, 'key.b');

      // Unbind one queue. The other remains bound.
      await exchangeInstance.unbindQueue(queueA, exchange, 'key.a');

      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeHasBoundQueuesError,
      );

      // The remaining binding is intact.
      const remaining = await exchangeInstance.matchQueues(exchange, 'key.b');
      expect(remaining).toEqual([queueB]);
    });
  });

  // -------------------------------------------------------------------------
  // Successful delete
  // -------------------------------------------------------------------------

  describe('successful delete', () => {
    it('succeeds after every bound queue is unbound', async () => {
      // The recovery path: establish a binding, remove it, then
      // delete. The delete succeeds because the precondition no longer
      // applies.
      const { queue, exchange, exchangeInstance } =
        await makeDirectFixture('dir-delete-clean');

      await exchangeInstance.bindQueue(queue, exchange, ROUTING_KEY);
      await exchangeInstance.unbindQueue(queue, exchange, ROUTING_KEY);

      await expect(exchangeInstance.delete(exchange)).resolves.toBeUndefined();
    });

    it('removes the exchange so a subsequent lookup fails as if it never existed', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeDirectFixture('dir-delete-removes');

      await exchangeInstance.bindQueue(queue, exchange, ROUTING_KEY);
      await exchangeInstance.unbindQueue(queue, exchange, ROUTING_KEY);
      await exchangeInstance.delete(exchange);

      await expect(
        exchangeInstance.matchQueues(exchange, ROUTING_KEY),
      ).rejects.toThrow(errors.ExchangeNotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // Deleting a missing exchange
  // -------------------------------------------------------------------------

  describe('missing exchange', () => {
    it('rejects with ExchangeNotFoundError when the exchange was never created', async () => {
      const exchange: IExchangeParams = {
        ns: 'dir-delete-missing',
        name: `ex-${randomUUID()}`,
      };

      const exchangeInstance = RedisSMQ.createDirectExchange();
      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeNotFoundError,
      );
    });

    it('rejects with ExchangeNotFoundError on a second delete of the same exchange', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeDirectFixture('dir-delete-twice');

      await exchangeInstance.bindQueue(queue, exchange, ROUTING_KEY);
      await exchangeInstance.unbindQueue(queue, exchange, ROUTING_KEY);

      await exchangeInstance.delete(exchange);

      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeNotFoundError,
      );
    });
  });
});
