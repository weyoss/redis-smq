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
  type IExchangeParams,
  type IQueueParams,
  RedisSMQ,
  EExchangeQueuePolicy,
  errors,
} from '../../../../src/index.js';
import { createQueue, uniqueQueue } from '../../../helpers/factories/queue.js';
import {
  makeFanoutFixture,
  makeQueues,
} from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for binding and unbinding queues on a fanout
 * exchange.
 *
 * A fanout exchange broadcasts every message to every bound queue.
 * There is no routing key and no binding pattern — the binding is
 * identified by `(queue, exchange)` alone, and the two operations that
 * maintain it reflect that:
 *
 *   - `bindQueue(queue, exchange)` — create a binding.
 *   - `unbindQueue(queue, exchange)` — remove a binding.
 *
 * Both take two arguments, unlike the direct and topic exchanges
 * where a third argument (routing key or pattern) identifies the
 * binding. The API shape is the fanout exchange's distinguishing
 * feature: a caller who binds a queue to a fanout exchange has said
 * "send me everything", and there is no key or pattern to further
 * qualify that.
 *
 * The other operations on a fanout exchange are covered in siblings:
 *
 *   - `broadcast.test.ts` — the match semantics, including
 *     `matchQueues` returning every bound queue.
 *   - `delete.test.ts` — `delete` and its preconditions.
 *   - `publishing/publish-via-exchange.test.ts` — end-to-end produce.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeFanout — bind/unbind', () => {
  // -------------------------------------------------------------------------
  // bindQueue
  // -------------------------------------------------------------------------

  describe('bindQueue', () => {
    it('binds a queue to the exchange', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeFanoutFixture('fan-bind');

      await exchangeInstance.bindQueue(queue, exchange);
      const matched = await exchangeInstance.matchQueues(exchange);
      expect(matched).toEqual([queue]);
    });

    it('is idempotent when binding the same queue twice', async () => {
      const { queue, exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-bind-idempotent',
      );

      await exchangeInstance.bindQueue(queue, exchange);
      await expect(
        exchangeInstance.bindQueue(queue, exchange),
      ).resolves.toBeUndefined();

      const matched = await exchangeInstance.matchQueues(exchange);

      expect(matched).toEqual([queue]);
    });

    it('rejects with NamespaceMismatchError when the queue and exchange are in different namespaces', async () => {
      const queue = uniqueQueue('fan-bind-mismatch');
      await createQueue(queue);

      const exchangeInOtherNs: IExchangeParams = {
        ns: `${queue.ns}-other`,
        name: `ex-${queue.name}`,
      };

      const exchangeInstance = RedisSMQ.createFanoutExchange();

      await expect(
        exchangeInstance.bindQueue(queue, exchangeInOtherNs),
      ).rejects.toThrow(errors.NamespaceMismatchError);
    });

    it('rejects with QueueNotFoundError when the queue does not exist', async () => {
      const existing = uniqueQueue('fan-bind-missing');
      await createQueue(existing);

      const nonexistentQueue: IQueueParams = {
        ns: existing.ns,
        name: `never-created-${Date.now()}`,
      };

      const exchange: IExchangeParams = {
        ns: existing.ns,
        name: `ex-${existing.name}`,
      };

      const exchangeInstance = RedisSMQ.createFanoutExchange();
      await exchangeInstance.create(exchange, EExchangeQueuePolicy.STANDARD);

      await expect(
        exchangeInstance.bindQueue(nonexistentQueue, exchange),
      ).rejects.toThrow(errors.QueueNotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // unbindQueue
  // -------------------------------------------------------------------------

  describe('unbindQueue', () => {
    it('removes an existing binding', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeFanoutFixture('fan-unbind');

      // Establish the binding first.
      await exchangeInstance.bindQueue(queue, exchange);

      // Confirm the binding is in place — this is the pre-state that
      // makes the post-unbind assertion meaningful. Without it, a
      // setup failure where the bind never happened would let the
      // post-unbind "empty" result pass for the wrong reason.
      const before = await exchangeInstance.matchQueues(exchange);
      expect(before).toEqual([queue]);

      await exchangeInstance.unbindQueue(queue, exchange);

      // The binding is gone: the exchange reports no targets.
      const after = await exchangeInstance.matchQueues(exchange);
      expect(after).toEqual([]);
    });

    it('rejects with ExchangeNotFoundError when the exchange does not exist', async () => {
      const queue = uniqueQueue('fan-unbind-no-exchange');
      await createQueue(queue);

      const exchange: IExchangeParams = {
        ns: queue.ns,
        name: `ex-${queue.name}`,
      };
      const exchangeInstance = RedisSMQ.createFanoutExchange();

      // No bind has happened. The exchange has never been written to
      // Redis.
      await expect(
        exchangeInstance.unbindQueue(queue, exchange),
      ).rejects.toThrow(errors.ExchangeNotFoundError);
    });

    it('rejects with QueueNotBoundError when the exchange exists but the queue is not bound', async () => {
      const { queue, exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-unbind-not-bound',
      );

      // Create the exchange by binding a different queue.
      const otherQueue = uniqueQueue('fan-unbind-other');
      await createQueue(otherQueue);
      await exchangeInstance.bindQueue(otherQueue, exchange);

      // The exchange now exists; `queue` is not bound to it.
      await expect(
        exchangeInstance.unbindQueue(queue, exchange),
      ).rejects.toThrow(errors.QueueNotBoundError);
    });

    it('does not affect other bound queues', async () => {
      const { exchange, exchangeInstance } = await makeFanoutFixture(
        'fan-unbind-independent',
      );

      const [queueA, queueB] = await makeQueues('fan-unbind-independent-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange);
      await exchangeInstance.bindQueue(queueB, exchange);

      // Unbind one queue.
      await exchangeInstance.unbindQueue(queueA, exchange);

      // The other remains bound.
      const remaining = await exchangeInstance.matchQueues(exchange);
      expect(remaining).toEqual([queueB]);
    });
  });
});
