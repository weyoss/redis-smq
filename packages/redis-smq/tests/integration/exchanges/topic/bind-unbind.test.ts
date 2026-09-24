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
import { makeTopicFixture } from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for binding and unbinding queues on a topic
 * exchange.
 *
 * A topic exchange routes messages by AMQP-style pattern match. A
 * caller binds a queue to the exchange under a *pattern* — a
 * dot-separated expression that may contain `*` (matches exactly one
 * token) and `#` (matches zero or more tokens). A message published
 * with a routing key is delivered to every queue whose pattern matches
 * the key.
 *
 * This file covers the two operations that maintain those bindings:
 *
 *   - `bindQueue(queue, exchange, pattern)` — create a binding.
 *   - `unbindQueue(queue, exchange, pattern)` — remove a binding.
 */

/**
 * A topic binding pattern that passes RedisSMQ's validator.
 *
 * `order.*` uses the `*` wildcard to match exactly one token in the
 * second position. It matches `order.created`, `order.cancelled`,
 * etc. — the tests below pick one concrete key per assertion.
 *
 * The character set the validator accepts is the subject of
 * `pattern-validation.test.ts`; here the value only needs to be valid.
 */
const PATTERN = 'order.*';

/**
 * A concrete routing key that `PATTERN` matches.
 */
const MATCHING_KEY = 'order.created';

/**
 * A concrete routing key that `PATTERN` does not match.
 *
 * `order.created.eu` has two tokens after `order`, whereas `order.*`
 * matches exactly one. The first test uses this key to confirm the
 * binding does not match everything.
 */
const NON_MATCHING_KEY = 'order.created.eu';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeTopic — bind/unbind', () => {
  // -------------------------------------------------------------------------
  // bindQueue
  // -------------------------------------------------------------------------

  describe('bindQueue', () => {
    it('binds a queue to the exchange under the given pattern', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-bind');

      await exchangeInstance.bindQueue(queue, exchange, PATTERN);

      // A message published with a matching key routes to the bound
      // queue. The match lookup uses a *concrete routing key*, not the
      // pattern — the pattern was stored as-is, and matching happens
      // here.
      const matched = await exchangeInstance.matchQueues(
        exchange,
        MATCHING_KEY,
      );

      expect(matched).toEqual([queue]);
    });

    it('does not match a routing key the pattern rejects', async () => {
      // The binding is for a specific pattern, not for "anything on
      // this exchange". A routing key the pattern cannot match does
      // not reach the bound queue.
      //
      // This test is the reason the file uses both a matching and a
      // non-matching key: an assertion that only checks the matching
      // case would pass if RedisSMQ's matcher returned every
      // binding regardless of the pattern.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-bind-nomatch');

      await exchangeInstance.bindQueue(queue, exchange, PATTERN);

      // Sanity: the pattern does match some key, so the exchange is
      // not simply returning empty results.
      const matched = await exchangeInstance.matchQueues(
        exchange,
        MATCHING_KEY,
      );
      expect(matched).toEqual([queue]);

      // A key the pattern cannot match.
      const notMatched = await exchangeInstance.matchQueues(
        exchange,
        NON_MATCHING_KEY,
      );
      expect(notMatched).toEqual([]);
    });

    it('is idempotent when binding the same queue/pattern pair twice', async () => {
      // RedisSMQ treats a duplicate bind as a no-op. The
      // strongest observable is that the queue still appears exactly
      // once in the match result — a regression that appended a
      // duplicate would show up as a two-element array.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-bind-idempotent',
      );

      await exchangeInstance.bindQueue(queue, exchange, PATTERN);
      await expect(
        exchangeInstance.bindQueue(queue, exchange, PATTERN),
      ).resolves.toBeUndefined();

      const matched = await exchangeInstance.matchQueues(
        exchange,
        MATCHING_KEY,
      );

      expect(matched).toEqual([queue]);
    });

    it('rejects with NamespaceMismatchError when the queue and exchange are in different namespaces', async () => {
      // Same precondition as the direct exchange: a binding requires
      // the queue and the exchange to share a namespace.
      const queue = uniqueQueue('top-bind-mismatch');
      await createQueue(queue);

      const exchangeInOtherNs: IExchangeParams = {
        ns: `${queue.ns}-other`,
        name: `ex-${queue.name}`,
      };

      const exchangeInstance = RedisSMQ.createTopicExchange();

      await expect(
        exchangeInstance.bindQueue(queue, exchangeInOtherNs, PATTERN),
      ).rejects.toThrow(errors.NamespaceMismatchError);
    });

    it('rejects with QueueNotFoundError when the queue does not exist', async () => {
      // Same precondition as the direct exchange: RedisSMQ
      // verifies the queue exists before creating the binding.
      const existing = uniqueQueue('top-bind-missing');
      await createQueue(existing);

      const nonexistentQueue: IQueueParams = {
        ns: existing.ns,
        name: `never-created-${Date.now()}`,
      };

      const exchange: IExchangeParams = {
        ns: existing.ns,
        name: `ex-${existing.name}`,
      };

      const exchangeInstance = RedisSMQ.createTopicExchange();
      await exchangeInstance.create(exchange, EExchangeQueuePolicy.STANDARD);

      await expect(
        exchangeInstance.bindQueue(nonexistentQueue, exchange, PATTERN),
      ).rejects.toThrow(errors.QueueNotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // unbindQueue
  // -------------------------------------------------------------------------

  describe('unbindQueue', () => {
    it('removes an existing binding', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-unbind');

      // Establish the binding and confirm it is in place.
      await exchangeInstance.bindQueue(queue, exchange, PATTERN);

      const before = await exchangeInstance.matchQueues(exchange, MATCHING_KEY);
      expect(before).toEqual([queue]);

      await exchangeInstance.unbindQueue(queue, exchange, PATTERN);

      // After the unbind, a routing key that matched the pattern no
      // longer finds the queue.
      const after = await exchangeInstance.matchQueues(exchange, MATCHING_KEY);
      expect(after).toEqual([]);
    });

    it('rejects with ExchangeNotFoundError when the exchange does not exist', async () => {
      const queue = uniqueQueue('top-unbind-no-exchange');
      await createQueue(queue);

      const exchange: IExchangeParams = {
        ns: queue.ns,
        name: `ex-${queue.name}`,
      };
      const exchangeInstance = RedisSMQ.createTopicExchange();

      await expect(
        exchangeInstance.unbindQueue(queue, exchange, PATTERN),
      ).rejects.toThrow(errors.ExchangeNotFoundError);
    });

    it('rejects with QueueNotBoundError when the exchange exists but the queue is not bound', async () => {
      // The exchange is created by binding a *different* queue under a
      // *different* pattern. The target queue has no binding at all,
      // so the unbind finds the exchange and reports the missing
      // binding.
      //
      // The other queue's pattern is deliberately chosen not to match
      // the target queue's pattern's keys, so the two bindings cannot
      // accidentally conflate.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-unbind-not-bound',
      );

      const otherQueue = uniqueQueue('top-unbind-other');
      await createQueue(otherQueue);
      await exchangeInstance.bindQueue(otherQueue, exchange, 'other.*');

      // `queue` has never been bound; the exchange exists because the
      // other queue's bind created it.
      await expect(
        exchangeInstance.unbindQueue(queue, exchange, PATTERN),
      ).rejects.toThrow(errors.QueueNotBoundError);
    });

    it('rejects with QueueNotBoundError when the queue is bound under a different pattern', async () => {
      // The distinction between "the queue is not bound at all" and
      // "the queue is bound under a different pattern". A topic
      // exchange's binding is identified by (queue, pattern); the same
      // queue can be bound under multiple patterns, and unbinding one
      // does not affect the others.
      //
      // The unbind targets a pattern the queue was never bound under,
      // even though the queue is bound under another pattern. The
      // framework reports the missing binding for *this* pattern.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-unbind-different-pattern',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');

      // Unbind under a different pattern the queue was never bound
      // under.
      await expect(
        exchangeInstance.unbindQueue(queue, exchange, 'payment.*'),
      ).rejects.toThrow(errors.QueueNotBoundError);

      // The original binding survives.
      const stillBound = await exchangeInstance.matchQueues(
        exchange,
        MATCHING_KEY,
      );
      expect(stillBound).toEqual([queue]);
    });
  });
});
