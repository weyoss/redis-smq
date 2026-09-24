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
import { makeTopicFixture } from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for deleting a topic exchange.
 *
 * `delete(exchange)` removes the exchange's bindings from Redis. It is
 * a lifecycle-closing operation: after it succeeds, the exchange is
 * gone and any subsequent operation on it — `matchQueues`,
 * `getRoutingPatterns`, another `delete` — behaves as though the
 * exchange had never existed.
 */

/**
 * A topic binding pattern that passes RedisSMQ's validator.
 *
 * `order.*` uses the `*` wildcard to match exactly one token in the
 * second position. The pattern is stored as-is; matching happens at
 * lookup time. The specific pattern value is not the subject of this
 * file — validation is `pattern-validation.test.ts`, matching is the
 * AMQP-semantics files — but the value must be valid so the bind
 * succeeds.
 */
const PATTERN = 'order.*';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeTopic — delete', () => {
  // -------------------------------------------------------------------------
  // Precondition: no bound queues
  // -------------------------------------------------------------------------

  describe('bound-queue precondition', () => {
    it('rejects with ExchangeHasBoundQueuesError when a queue is still bound', async () => {
      // The core precondition. The exchange exists, a queue is bound
      // to it under a pattern, and the delete refuses.
      //
      // The order of operations matters: the bind has to happen first
      // so that the exchange exists in Redis *and* has a binding. A
      // delete on an exchange that only exists (with no bindings) is a
      // different case — see the "succeeds after every bound queue is
      // unbound" test below.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-delete-blocked');

      await exchangeInstance.bindQueue(queue, exchange, PATTERN);

      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeHasBoundQueuesError,
      );

      // The exchange's bindings survived the rejected delete. A
      // regression where RedisSMQ removed the bindings before
      // checking the precondition — leaving a corrupted exchange —
      // would be caught by the match read here.
      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );
      expect(matched).toEqual([queue]);
    });

    it('rejects while at least one queue is still bound, even after another is unbound', async () => {
      // Two queues bound under two patterns. Unbind one. The delete
      // still refuses because the other is still bound.
      //
      // A regression where the precondition counted the *first*
      // unbind as clearing the exchange — a plausible bug if the
      // check used a boolean flag rather than the binding set's
      // cardinality — would let the delete succeed here with a
      // binding still present.
      const { exchange, exchangeInstance } =
        await makeTopicFixture('top-delete-partial');

      const queueA = uniqueQueue('top-delete-partial-a');
      await createQueue(queueA);
      const queueB = uniqueQueue('top-delete-partial-b');
      await createQueue(queueB);

      await exchangeInstance.bindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'payment.#');

      // Unbind one queue. The other remains bound.
      await exchangeInstance.unbindQueue(queueA, exchange, 'order.*');

      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeHasBoundQueuesError,
      );

      // The remaining binding is intact.
      const remaining = await exchangeInstance.matchQueues(
        exchange,
        'payment.processed',
      );
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
        await makeTopicFixture('top-delete-clean');

      await exchangeInstance.bindQueue(queue, exchange, PATTERN);
      await exchangeInstance.unbindQueue(queue, exchange, PATTERN);

      await expect(exchangeInstance.delete(exchange)).resolves.toBeUndefined();
    });

    it('succeeds after unbinding every pattern-scoped binding on the exchange', async () => {
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-delete-multi-pattern',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');
      await exchangeInstance.bindQueue(queue, exchange, 'payment.#');

      // Unbind one pattern. The delete still refuses.
      await exchangeInstance.unbindQueue(queue, exchange, 'order.*');
      await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
        errors.ExchangeHasBoundQueuesError,
      );

      // Unbind the second. The delete now succeeds.
      await exchangeInstance.unbindQueue(queue, exchange, 'payment.#');
      await expect(exchangeInstance.delete(exchange)).resolves.toBeUndefined();
    });

    it('rejects with ExchangeNotFoundError on a lookup after the exchange is deleted', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-delete-removes');

      await exchangeInstance.bindQueue(queue, exchange, PATTERN);
      await exchangeInstance.unbindQueue(queue, exchange, PATTERN);
      await exchangeInstance.delete(exchange);

      await expect(
        exchangeInstance.matchQueues(exchange, 'order.created'),
      ).rejects.toThrow(errors.ExchangeNotFoundError);
    });

    // -------------------------------------------------------------------------
    // Deleting a missing exchange
    // -------------------------------------------------------------------------

    describe('missing exchange', () => {
      it('rejects with ExchangeNotFoundError when the exchange was never created', async () => {
        const queue = uniqueQueue('top-delete-missing');
        await createQueue(queue);

        const exchange: IExchangeParams = {
          ns: queue.ns,
          name: `ex-${queue.name}`,
        };
        const exchangeInstance = RedisSMQ.createTopicExchange();

        await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
          errors.ExchangeNotFoundError,
        );
      });

      it('rejects with ExchangeNotFoundError on a second delete of the same exchange', async () => {
        const { queue, exchange, exchangeInstance } =
          await makeTopicFixture('top-delete-twice');

        await exchangeInstance.bindQueue(queue, exchange, PATTERN);
        await exchangeInstance.unbindQueue(queue, exchange, PATTERN);

        await exchangeInstance.delete(exchange);

        await expect(exchangeInstance.delete(exchange)).rejects.toThrow(
          errors.ExchangeNotFoundError,
        );
      });
    });
  });
});
