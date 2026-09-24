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
import { makeDirectFixture } from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for binding and unbinding queues on a direct
 * exchange.
 *
 * A direct exchange routes messages by exact routing-key match. The
 * caller binds a queue to the exchange under a specific key; a message
 * produced with that key is delivered to the bound queue. This file
 * covers the two operations that maintain those bindings:
 *
 *   - `bindQueue(queue, exchange, routingKey)` — create a binding.
 *   - `unbindQueue(queue, exchange, routingKey)` — remove a binding.
 */

/**
 * A routing key that passes the direct-exchange validator.
 *
 * The allowed character set for direct routing keys is a subset of the
 * one for identifiers — letters, digits, hyphen, underscore, and dot,
 * with a leading letter. The specific rules are the subject of
 * `routing-keys.test.ts`; here the value only needs to be valid.
 */
const ROUTING_KEY = 'test.key';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeDirect — bind/unbind', () => {
  // -------------------------------------------------------------------------
  // bindQueue
  // -------------------------------------------------------------------------

  describe('bindQueue', () => {
    it('binds a queue to the exchange under the given routing key', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeDirectFixture('dir-bind');

      await exchangeInstance.bindQueue(queue, exchange, ROUTING_KEY);

      // The binding took effect: the exchange now reports the queue as
      // a target for this routing key. The `matchQueues` call is the
      // only public observation of a binding; its own semantics
      // (exact-match, ordering, etc.) are covered in the sibling file.
      const matched = await exchangeInstance.matchQueues(exchange, ROUTING_KEY);

      expect(matched).toEqual([queue]);
    });

    it('is idempotent when binding the same queue/key pair twice', async () => {
      const { queue, exchange, exchangeInstance } = await makeDirectFixture(
        'dir-bind-idempotent',
      );

      await exchangeInstance.bindQueue(queue, exchange, ROUTING_KEY);
      await expect(
        exchangeInstance.bindQueue(queue, exchange, ROUTING_KEY),
      ).resolves.toBeUndefined();

      const matched = await exchangeInstance.matchQueues(exchange, ROUTING_KEY);

      expect(matched).toEqual([queue]);
    });

    it('rejects with NamespaceMismatchError when the queue and exchange are in different namespaces', async () => {
      const queue = uniqueQueue('dir-bind-mismatch');
      await createQueue(queue);

      const exchangeInOtherNs: IExchangeParams = {
        ns: `${queue.ns}-other`,
        name: `ex-${queue.name}`,
      };

      const exchangeInstance = RedisSMQ.createDirectExchange();

      await expect(
        exchangeInstance.bindQueue(queue, exchangeInOtherNs, ROUTING_KEY),
      ).rejects.toThrow(errors.NamespaceMismatchError);
    });

    it('rejects with QueueNotFoundError when the queue does not exist', async () => {
      const existing = uniqueQueue('dir-bind-missing');
      await createQueue(existing);

      const nonexistentQueue: IQueueParams = {
        ns: existing.ns,
        name: `never-created-${Date.now()}`,
      };

      const exchange: IExchangeParams = {
        ns: existing.ns,
        name: `ex-${existing.name}`,
      };

      const exchangeInstance = RedisSMQ.createDirectExchange();
      await exchangeInstance.create(exchange, EExchangeQueuePolicy.STANDARD);

      await expect(
        exchangeInstance.bindQueue(nonexistentQueue, exchange, ROUTING_KEY),
      ).rejects.toThrow(errors.QueueNotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // unbindQueue
  // -------------------------------------------------------------------------

  describe('unbindQueue', () => {
    it('removes an existing binding', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeDirectFixture('dir-unbind');

      // Establish the binding first.
      await exchangeInstance.bindQueue(queue, exchange, ROUTING_KEY);

      // Confirm the binding is in place — this is the pre-state that
      // makes the post-unbind assertion meaningful. Without it, a
      // setup failure where the bind never happened would let the
      // post-unbind "empty" result pass for the wrong reason.
      const before = await exchangeInstance.matchQueues(exchange, ROUTING_KEY);
      expect(before).toEqual([queue]);

      await exchangeInstance.unbindQueue(queue, exchange, ROUTING_KEY);

      // The binding is gone: the exchange reports no targets for the
      // routing key.
      const after = await exchangeInstance.matchQueues(exchange, ROUTING_KEY);
      expect(after).toEqual([]);
    });

    it('rejects with ExchangeNotFoundError when the exchange does not exist', async () => {
      const queue = uniqueQueue('dir-unbind-no-exchange');
      await createQueue(queue);

      const exchangeInstance = RedisSMQ.createDirectExchange();

      const exchange: IExchangeParams = {
        ns: queue.ns,
        name: `ex-${queue.name}`,
      };

      // No bind has happened. The exchange has never been written to
      // Redis.
      await expect(
        exchangeInstance.unbindQueue(queue, exchange, ROUTING_KEY),
      ).rejects.toThrow(errors.ExchangeNotFoundError);
    });

    it('rejects with QueueNotBoundError when the exchange exists but the queue is not bound', async () => {
      const { queue, exchange, exchangeInstance } = await makeDirectFixture(
        'dir-unbind-not-bound',
      );

      // Create the exchange by binding a different queue.
      const otherQueue = uniqueQueue('dir-unbind-other');
      await createQueue(otherQueue);
      await exchangeInstance.bindQueue(otherQueue, exchange, ROUTING_KEY);

      // The exchange now exists; `queue` is not bound to it.
      await expect(
        exchangeInstance.unbindQueue(queue, exchange, ROUTING_KEY),
      ).rejects.toThrow(errors.QueueNotBoundError);
    });
  });
});
