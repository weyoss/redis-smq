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
  makeQueues,
  makeTopicFixture,
  sortQueues,
} from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for the topic exchange's routing pattern
 * accessors.
 *
 * A topic exchange stores its bindings as (pattern, queue) pairs. The
 * public API reads those bindings through three accessors:
 *
 *   - `matchQueues(exchange, routingKey)` — the routing function.
 *     Returns the queues that should receive a message published
 *     under `routingKey`. This file does not re-test its semantics;
 *     those are covered in the sibling matching files
 *     (`exact-match.test.ts`, `amqp-star.test.ts`, `amqp-hash.test.ts`,
 *     `amqp-combined.test.ts`, `deduplication.test.ts`).
 *
 *   - `getRoutingPatterns(exchange)` — the set of patterns the
 *     exchange has at least one binding for. One entry per distinct
 *     pattern, not per binding.
 *
 *   - `getRoutingPatternBoundQueues(exchange, pattern)` — the set of
 *     queues bound under a specific pattern.
 *
 * The file's focus is the last two. The `matchQueues` agreement block
 * at the end uses `matchQueues` only to confirm the three accessors
 * describe the same underlying state — it does not assert the
 * matching semantics, which are the sibling files' concern.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeTopic — pattern accessors', () => {
  // -------------------------------------------------------------------------
  // getRoutingPatterns
  // -------------------------------------------------------------------------

  describe('getRoutingPatterns', () => {
    it('returns an empty list for an exchange with no bindings', async () => {
      const { exchange, exchangeInstance } =
        await makeTopicFixture('top-patterns-empty');

      const patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect(patterns).toEqual([]);
    });

    it('returns the single pattern after one bind', async () => {
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-patterns-single',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');

      const patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect(patterns).toEqual(['order.*']);
    });

    it('returns every bound pattern', async () => {
      const { exchange, exchangeInstance } =
        await makeTopicFixture('top-patterns-list');

      const [queueA, queueB] = await makeQueues('top-patterns-list-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'payment.#');

      const patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect([...patterns].sort()).toEqual(['order.*', 'payment.#']);
    });

    it('reports a pattern as a unique entry even when multiple queues share it', async () => {
      const { exchange, exchangeInstance } = await makeTopicFixture(
        'top-patterns-unique',
      );

      const [queueA, queueB] = await makeQueues('top-patterns-unique-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'order.*');

      const patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect(patterns).toEqual(['order.*']);
    });

    it('keeps a pattern while at least one queue remains bound under it', async () => {
      const { exchange, exchangeInstance } = await makeTopicFixture(
        'top-patterns-persist',
      );

      const [queueA, queueB] = await makeQueues('top-patterns-persist-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'order.*');

      // Both bound: the pattern is present.
      let patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect(patterns).toEqual(['order.*']);

      // Unbind one: the pattern is still present.
      await exchangeInstance.unbindQueue(queueA, exchange, 'order.*');
      patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect(patterns).toEqual(['order.*']);
    });

    it('drops a pattern after the last bound queue is unbound', async () => {
      const { exchange, exchangeInstance } =
        await makeTopicFixture('top-patterns-drop');

      const [queueA, queueB] = await makeQueues('top-patterns-drop-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'order.*');

      await exchangeInstance.unbindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.unbindQueue(queueB, exchange, 'order.*');

      const patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect(patterns).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // getRoutingPatternBoundQueues
  // -------------------------------------------------------------------------

  describe('getRoutingPatternBoundQueues', () => {
    it('returns the queue bound under the given pattern', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-bound-single');

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');

      const queues = await exchangeInstance.getRoutingPatternBoundQueues(
        exchange,
        'order.*',
      );

      expect(queues).toEqual([queue]);
    });

    it('returns every queue bound under the same pattern', async () => {
      const { exchange, exchangeInstance } =
        await makeTopicFixture('top-bound-multiple');

      const [queueA, queueB] = await makeQueues('top-bound-multiple-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'order.*');

      const queues = await exchangeInstance.getRoutingPatternBoundQueues(
        exchange,
        'order.*',
      );

      expect(sortQueues(queues)).toEqual(sortQueues([queueA, queueB]));
    });

    it('returns an empty list for a pattern with no bound queues', async () => {
      const { exchange, exchangeInstance } =
        await makeTopicFixture('top-bound-empty');

      const [queue] = await makeQueues('top-bound-empty-q', 1);
      await exchangeInstance.bindQueue(queue, exchange, 'order.*');

      const queues = await exchangeInstance.getRoutingPatternBoundQueues(
        exchange,
        'payment.#',
      );

      expect(queues).toEqual([]);
    });

    it('scopes the result to the queried pattern', async () => {
      const { exchange, exchangeInstance } =
        await makeTopicFixture('top-bound-scoped');

      const [queueA, queueB] = await makeQueues('top-bound-scoped-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'payment.#');

      const underOrder = await exchangeInstance.getRoutingPatternBoundQueues(
        exchange,
        'order.*',
      );
      const underPayment = await exchangeInstance.getRoutingPatternBoundQueues(
        exchange,
        'payment.#',
      );

      expect(underOrder).toEqual([queueA]);
      expect(underPayment).toEqual([queueB]);
    });
  });

  // -------------------------------------------------------------------------
  // Agreement between the three accessors
  // -------------------------------------------------------------------------

  describe('agreement between accessors', () => {
    it('the pattern list, the per-pattern queues, and the match result describe the same bindings', async () => {
      // The three accessors read the same underlying storage from
      // three different angles. This test binds a small configuration
      // and asserts that each accessor's view is consistent with the
      // others.
      //
      // The configuration:
      //
      //   queueA bound under `order.*`
      //   queueB bound under `order.*` and `payment.#`
      //
      // Expected views:
      //
      //   getRoutingPatterns         → ['order.*', 'payment.#']
      //   getRoutingPatternBoundQueues('order.*')   → [queueA, queueB]
      //   getRoutingPatternBoundQueues('payment.#') → [queueB]
      //   matchQueues('order.created')              → [queueA, queueB]
      //   matchQueues('payment.processed')          → [queueB]
      //
      // A regression where the two getters read from different
      // storage, or where one of them reflected a stale state, would
      // fail at the specific assertion that disagreed — the failure
      // names the accessor and the expected vs. actual view.
      const { exchange, exchangeInstance } = await makeTopicFixture(
        'top-accessor-agreement',
      );

      const [queueA, queueB] = await makeQueues('top-accessor-agreement-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'payment.#');

      // getRoutingPatterns reports both patterns, once each.
      const patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect([...patterns].sort()).toEqual(['order.*', 'payment.#']);

      // getRoutingPatternBoundQueues reports the queues under each
      // pattern.
      const underOrder = await exchangeInstance.getRoutingPatternBoundQueues(
        exchange,
        'order.*',
      );
      const underPayment = await exchangeInstance.getRoutingPatternBoundQueues(
        exchange,
        'payment.#',
      );

      expect(sortQueues(underOrder)).toEqual(sortQueues([queueA, queueB]));
      expect(underPayment).toEqual([queueB]);

      // matchQueues agrees with the pattern-scoped view for keys that
      // each pattern matches.
      //
      // `order.created` matches `order.*` and is what the two queues
      // under that pattern receive.
      const matchOrder = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );
      expect(sortQueues(matchOrder)).toEqual(sortQueues([queueA, queueB]));

      // `payment.processed` matches `payment.#` and reaches queueB.
      const matchPayment = await exchangeInstance.matchQueues(
        exchange,
        'payment.processed',
      );
      expect(matchPayment).toEqual([queueB]);
    });
  });

  // -------------------------------------------------------------------------
  // Exchange isolation
  // -------------------------------------------------------------------------

  describe('exchange isolation', () => {
    it('does not leak bindings from one exchange to another in the same namespace', async () => {
      const {
        queue: queueA,
        exchange: exchangeA,
        exchangeInstance,
      } = await makeTopicFixture('top-iso-a');

      const exchangeB: IExchangeParams = {
        ns: exchangeA.ns,
        name: `ex-b-${Date.now()}`,
      };
      await exchangeInstance.create(exchangeB, EExchangeQueuePolicy.STANDARD);

      const queueB = uniqueQueue('top-iso-b');
      await createQueue(queueB);

      await exchangeInstance.bindQueue(queueA, exchangeA, 'shared.*');
      await exchangeInstance.bindQueue(queueB, exchangeB, 'shared.*');

      // Each exchange's pattern list contains its own pattern.
      const patternsA = await exchangeInstance.getRoutingPatterns(exchangeA);
      const patternsB = await exchangeInstance.getRoutingPatterns(exchangeB);

      expect(patternsA).toEqual(['shared.*']);
      expect(patternsB).toEqual(['shared.*']);

      // Each exchange's per-pattern queue list contains only its own
      // queue. This is the assertion that catches a storage collision:
      // if the exchange name were dropped, both lookups would return
      // both queues.
      const boundA = await exchangeInstance.getRoutingPatternBoundQueues(
        exchangeA,
        'shared.*',
      );
      const boundB = await exchangeInstance.getRoutingPatternBoundQueues(
        exchangeB,
        'shared.*',
      );

      expect(boundA).toEqual([queueA]);
      expect(boundB).toEqual([queueB]);

      // And the match results agree.
      const matchA = await exchangeInstance.matchQueues(exchangeA, 'shared.x');
      const matchB = await exchangeInstance.matchQueues(exchangeB, 'shared.x');

      expect(matchA).toEqual([queueA]);
      expect(matchB).toEqual([queueB]);
    });
  });
});
