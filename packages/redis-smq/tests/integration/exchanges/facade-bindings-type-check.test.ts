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
  EExchangeType,
  EQueueType,
  errors,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue, uniqueQueue } from '../../helpers/factories/queue.js';
import { sortQueues } from '../../helpers/factories/exchange.js';

/**
 * Integration tests for the facade `getBindings` type check.
 *
 * Each facade (`ExchangeDirect`, `ExchangeTopic`, `ExchangeFanout`) is a
 * compile-time handle for one exchange type. `ExchangeManager.getBindings`
 * returns a union (`TExchangeBindings`) whose member is selected by the
 * exchange's *stored* type — so a facade that held a `{ ns, name }`
 * across a delete-and-recreate would receive a shape that contradicts
 * its own contract.
 *
 * The fix routes facade calls through `ExchangeManager.getBindingsForType`,
 * which verifies the stored type matches before dispatching. A mismatch
 * rejects with `ExchangeTypeMismatchError` instead of returning a
 * silently wrong union member.
 *
 * These tests exercise that guard at the facade boundary. The
 * exchange-manager-level behavior is covered in `exchange-manager.test.ts`;
 * this file is specifically about the cast that the facades apply on
 * top of the manager's union return.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generate a unique exchange name scoped to the test that calls it.
 *
 * Mirrors the pattern of `uniqueQueue` in the queue factories: a
 * monotonically increasing counter and a caller-supplied prefix, so
 * tests running in parallel against a shared Redis do not collide on
 * the exchange registry.
 */
let exchangeCounter = 0;
function uniqueExchangeName(prefix: string): string {
  exchangeCounter += 1;
  return `${prefix}-${Date.now()}-${exchangeCounter}`;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Facade getBindings type check', () => {
  // -------------------------------------------------------------------------
  // Mismatched stored type
  // -------------------------------------------------------------------------

  describe('mismatched stored type', () => {
    it('rejects a Direct facade when the exchange has been recreated as TOPIC', async () => {
      const name = uniqueExchangeName('facade-direct-to-topic');
      const direct = RedisSMQ.createDirectExchange();
      const mgr = RedisSMQ.createExchangeManager();

      // Create as DIRECT.
      await direct.create(name, EExchangeQueuePolicy.STANDARD);

      // Delete and recreate as TOPIC at the same (ns, name). This is
      // allowed — exchanges have no version lock — and it is exactly
      // the scenario that would break the old unchecked cast.
      await mgr.delete(name);
      await mgr.create(
        name,
        EExchangeType.TOPIC,
        EExchangeQueuePolicy.STANDARD,
      );

      // The stale Direct facade must reject, not return a lie.
      await expect(direct.getBindings(name)).rejects.toThrow(
        errors.ExchangeTypeMismatchError,
      );
    });

    it('rejects a Fanout facade when the exchange has been recreated as DIRECT', async () => {
      // The sharpest of the three cases: direct and topic share the
      // same Record-shaped union member, so a stale facade for either
      // would produce a shape at least structurally similar. Fanout is
      // structurally incompatible with both — a Record cast to an array
      // produces a one-element array whose single element is not a
      // queue.
      const name = uniqueExchangeName('facade-fanout-to-direct');
      const fanout = RedisSMQ.createFanoutExchange();
      const mgr = RedisSMQ.createExchangeManager();

      await fanout.create(name, EExchangeQueuePolicy.STANDARD);

      await mgr.delete(name);
      await mgr.create(
        name,
        EExchangeType.DIRECT,
        EExchangeQueuePolicy.STANDARD,
      );

      await expect(fanout.getBindings(name)).rejects.toThrow(
        errors.ExchangeTypeMismatchError,
      );
    });

    it('rejects a Topic facade when the exchange has been recreated as FANOUT', async () => {
      const name = uniqueExchangeName('facade-topic-to-fanout');
      const topic = RedisSMQ.createTopicExchange();
      const mgr = RedisSMQ.createExchangeManager();

      await topic.create(name, EExchangeQueuePolicy.STANDARD);

      await mgr.delete(name);
      await mgr.create(
        name,
        EExchangeType.FANOUT,
        EExchangeQueuePolicy.STANDARD,
      );

      await expect(topic.getBindings(name)).rejects.toThrow(
        errors.ExchangeTypeMismatchError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Matching stored type — happy path
  // -------------------------------------------------------------------------

  describe('matching stored type', () => {
    it('returns an empty map for a direct exchange with no bindings', async () => {
      const name = uniqueExchangeName('facade-direct-empty');
      const direct = RedisSMQ.createDirectExchange();
      await direct.create(name, EExchangeQueuePolicy.STANDARD);

      // No bindings yet. The result is the record-shaped member of the
      // union, and it is empty.
      const bindings = await direct.getBindings(name);
      expect(bindings).toEqual({});
    });

    it('returns the routing-key-to-queues map for a direct exchange', async () => {
      const name = uniqueExchangeName('facade-direct-bindings');
      const queue = uniqueQueue('facade-direct-bindings-q');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const direct = RedisSMQ.createDirectExchange();
      await direct.create(name, EExchangeQueuePolicy.STANDARD);
      await direct.bindQueue(queue, name, 'order.created');

      const bindings = await direct.getBindings(name);
      expect(bindings).toHaveProperty('order.created');
      expect(bindings['order.created']).toEqual([queue]);
    });

    it('returns the pattern-to-queues map for a topic exchange', async () => {
      const name = uniqueExchangeName('facade-topic-bindings');
      const queue = uniqueQueue('facade-topic-bindings-q');
      await createQueue(queue, EQueueType.FIFO_QUEUE);

      const topic = RedisSMQ.createTopicExchange();
      await topic.create(name, EExchangeQueuePolicy.STANDARD);
      await topic.bindQueue(queue, name, 'order.#');

      const bindings = await topic.getBindings(name);
      expect(bindings).toHaveProperty('order.#');
      expect(bindings['order.#']).toEqual([queue]);
    });

    it('returns the flat queue list for a fanout exchange', async () => {
      const name = uniqueExchangeName('facade-fanout-bindings');
      const queueA = uniqueQueue('facade-fanout-bindings-a');
      const queueB = uniqueQueue('facade-fanout-bindings-b');
      await createQueue(queueA, EQueueType.FIFO_QUEUE);
      await createQueue(queueB, EQueueType.FIFO_QUEUE);

      const fanout = RedisSMQ.createFanoutExchange();
      await fanout.create(name, EExchangeQueuePolicy.STANDARD);
      await fanout.bindQueue(queueA, name);
      await fanout.bindQueue(queueB, name);

      const bindings = await fanout.getBindings(name);

      // Fanout returns a flat array, not a map. The order is undefined
      // (SMEMBERS-derived), so sort both sides before comparing.
      expect(Array.isArray(bindings)).toBe(true);
      expect(bindings).toHaveLength(2);
      expect(sortQueues([...bindings])).toEqual(sortQueues([queueA, queueB]));
    });

    // -------------------------------------------------------------------------
    // Missing exchange
    // -------------------------------------------------------------------------

    describe('missing exchange', () => {
      it('rejects a Direct facade with ExchangeNotFoundError for a missing exchange', async () => {
        const direct = RedisSMQ.createDirectExchange();
        const name = uniqueExchangeName('facade-direct-missing');

        await expect(direct.getBindings(name)).rejects.toThrow(
          errors.ExchangeNotFoundError,
        );
      });

      it('rejects a Fanout facade with ExchangeNotFoundError for a missing exchange', async () => {
        const fanout = RedisSMQ.createFanoutExchange();
        const name = uniqueExchangeName('facade-fanout-missing');

        await expect(fanout.getBindings(name)).rejects.toThrow(
          errors.ExchangeNotFoundError,
        );
      });

      it('rejects a Topic facade with ExchangeNotFoundError for a missing exchange', async () => {
        const topic = RedisSMQ.createTopicExchange();
        const name = uniqueExchangeName('facade-topic-missing');

        await expect(topic.getBindings(name)).rejects.toThrow(
          errors.ExchangeNotFoundError,
        );
      });
    });
  });
});
