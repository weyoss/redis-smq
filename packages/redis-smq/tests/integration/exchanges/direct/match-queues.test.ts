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
  makeDirectFixture,
  makeQueues,
  sortQueues,
} from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for the direct exchange's routing lookup.
 *
 * `matchQueues(exchange, routingKey)` is the exchange's routing
 * function: given a routing key, it returns the queues that should
 * receive a message produced with that key. For a direct exchange the
 * matching is exact — a queue bound under key K receives messages
 * published with key K and no others.
 *
 * The observability getters that read the exchange's binding set are
 * covered in the same file:
 *
 *   - `getRoutingKeys(exchange)` — the set of keys that have at least
 *     one bound queue.
 *   - `getRoutingKeyBoundQueues(exchange, key)` — the set of queues
 *     bound under a specific key.
 *
 * The three are grouped here because they answer the same
 * question — "what does the exchange's binding set look like?" —
 * from three different angles: by key (which queues match), by
 * exchange (which keys exist), and by key-to-queues (which queues
 * are under a specific key).
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeDirect — routing lookup', () => {
  // -------------------------------------------------------------------------
  // matchQueues
  // -------------------------------------------------------------------------

  describe('matchQueues', () => {
    it('returns the queue bound under the exact key', async () => {
      // The core routing contract. A single queue, a single key, an
      // exact match. `toEqual` with a single-element array is
      // order-insensitive by construction — there is only one element
      // to order.
      const { queue, exchange, exchangeInstance } =
        await makeDirectFixture('dir-match-exact');

      await exchangeInstance.bindQueue(queue, exchange, 'order.created');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );

      expect(matched).toEqual([queue]);
    });

    it('returns an empty list for a key with no bindings', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeDirectFixture('dir-match-miss');

      // Bind one queue under one key, then look up a *different* key.
      // The exchange now exists (so the lookup does not fail with
      // `ExchangeNotFoundError`), but the target key has no bindings.
      await exchangeInstance.bindQueue(queue, exchange, 'order.created');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.cancelled',
      );

      expect(matched).toEqual([]);
    });

    it('returns every queue bound under the same key', async () => {
      const { exchange, exchangeInstance } =
        await makeDirectFixture('dir-match-multi');

      const [queueA, queueB] = await makeQueues('dir-match-multi-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'shared.key');
      await exchangeInstance.bindQueue(queueB, exchange, 'shared.key');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        'shared.key',
      );

      expect(sortQueues(matched)).toEqual(sortQueues([queueA, queueB]));
    });

    it('does not return queues bound under a different key on the same exchange', async () => {
      const { exchange, exchangeInstance } = await makeDirectFixture(
        'dir-match-isolated-keys',
      );

      const [queueA, queueB] = await makeQueues('dir-match-isolated-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'key.a');
      await exchangeInstance.bindQueue(queueB, exchange, 'key.b');

      const forKeyA = await exchangeInstance.matchQueues(exchange, 'key.a');
      const forKeyB = await exchangeInstance.matchQueues(exchange, 'key.b');

      expect(forKeyA).toEqual([queueA]);
      expect(forKeyB).toEqual([queueB]);
    });
  });

  // -------------------------------------------------------------------------
  // getRoutingKeys
  // -------------------------------------------------------------------------

  describe('getRoutingKeys', () => {
    it('returns an empty list for an exchange with no bindings', async () => {
      const { exchange, exchangeInstance } =
        await makeDirectFixture('dir-keys-empty');

      const keys = await exchangeInstance.getRoutingKeys(exchange);
      expect(keys).toEqual([]);
    });

    it('returns the keys that have at least one bound queue', async () => {
      const { exchange, exchangeInstance } =
        await makeDirectFixture('dir-keys-list');

      const [queueA, queueB] = await makeQueues('dir-keys-list-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'key.a');
      await exchangeInstance.bindQueue(queueB, exchange, 'key.b');

      const keys = await exchangeInstance.getRoutingKeys(exchange);
      expect([...keys].sort()).toEqual(['key.a', 'key.b']);
    });

    it('reports a key as a unique entry even when multiple queues share it', async () => {
      // Two queues bound to the same key. The key appears once, not
      // twice. A regression where the accessor returned one entry per
      // binding rather than one per key would produce a two-element
      // array with duplicates.
      const { exchange, exchangeInstance } =
        await makeDirectFixture('dir-keys-unique');

      const [queueA, queueB] = await makeQueues('dir-keys-unique-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'shared.key');
      await exchangeInstance.bindQueue(queueB, exchange, 'shared.key');

      const keys = await exchangeInstance.getRoutingKeys(exchange);
      expect(keys).toEqual(['shared.key']);
    });

    it('drops a key only after the last bound queue is unbound', async () => {
      const { exchange, exchangeInstance } =
        await makeDirectFixture('dir-keys-lifetime');

      const [queueA, queueB] = await makeQueues('dir-keys-lifetime-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'shared.key');
      await exchangeInstance.bindQueue(queueB, exchange, 'shared.key');

      // Both bound: the key is present.
      let keys = await exchangeInstance.getRoutingKeys(exchange);
      expect(keys).toEqual(['shared.key']);

      // Unbind one: the key is still present.
      await exchangeInstance.unbindQueue(queueA, exchange, 'shared.key');
      keys = await exchangeInstance.getRoutingKeys(exchange);
      expect(keys).toEqual(['shared.key']);

      // Unbind the last: the key is gone.
      await exchangeInstance.unbindQueue(queueB, exchange, 'shared.key');
      keys = await exchangeInstance.getRoutingKeys(exchange);
      expect(keys).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // getRoutingKeyBoundQueues
  // -------------------------------------------------------------------------

  describe('getRoutingKeyBoundQueues', () => {
    it('returns the queues bound under a specific key', async () => {
      const { exchange, exchangeInstance } =
        await makeDirectFixture('dir-key-queues');

      const [queueA, queueB] = await makeQueues('dir-key-queues-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'shared.key');
      await exchangeInstance.bindQueue(queueB, exchange, 'shared.key');

      const queues = await exchangeInstance.getRoutingKeyBoundQueues(
        exchange,
        'shared.key',
      );

      expect(sortQueues(queues)).toEqual(sortQueues([queueA, queueB]));
    });

    it('returns an empty list for a key with no bound queues', async () => {
      const { exchange, exchangeInstance } = await makeDirectFixture(
        'dir-key-queues-empty',
      );

      const { queue } = await makeDirectFixture('dir-key-queues-empty-q');
      await exchangeInstance.bindQueue(queue, exchange, 'key.present');

      const queues = await exchangeInstance.getRoutingKeyBoundQueues(
        exchange,
        'key.absent',
      );

      expect(queues).toEqual([]);
    });

    it('returns only the queues under the queried key, not the whole exchange', async () => {
      const { exchange, exchangeInstance } = await makeDirectFixture(
        'dir-key-queues-scoped',
      );

      const [queueA, queueB] = await makeQueues('dir-key-queues-scoped-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'key.a');
      await exchangeInstance.bindQueue(queueB, exchange, 'key.b');

      const underA = await exchangeInstance.getRoutingKeyBoundQueues(
        exchange,
        'key.a',
      );
      const underB = await exchangeInstance.getRoutingKeyBoundQueues(
        exchange,
        'key.b',
      );

      expect(underA).toEqual([queueA]);
      expect(underB).toEqual([queueB]);
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
      } = await makeDirectFixture('dir-iso-a');

      const exchangeB: IExchangeParams = {
        ns: exchangeA.ns,
        name: `ex-b-${Date.now()}`,
      };
      await exchangeInstance.create(exchangeB, EExchangeQueuePolicy.STANDARD);

      const queueB = uniqueQueue('dir-iso-b');
      await createQueue(queueB);

      // One queue bound to each exchange under the *same* key. Same
      // key is deliberate: if the exchange name were dropped from the
      // storage key, the two bindings would collide.
      await exchangeInstance.bindQueue(queueA, exchangeA, 'shared.key');
      await exchangeInstance.bindQueue(queueB, exchangeB, 'shared.key');

      // Each exchange's lookup returns only its own queue.
      const matchA = await exchangeInstance.matchQueues(
        exchangeA,
        'shared.key',
      );
      const matchB = await exchangeInstance.matchQueues(
        exchangeB,
        'shared.key',
      );

      expect(matchA).toEqual([queueA]);
      expect(matchB).toEqual([queueB]);

      // The same isolation holds for the two getters.
      const keysA = await exchangeInstance.getRoutingKeys(exchangeA);
      const keysB = await exchangeInstance.getRoutingKeys(exchangeB);

      // Each exchange has exactly one key. If the storage were
      // shared, both would report the same key set, but the assertions
      // would still pass — the isolation is on the queue set, not on
      // the key names. The next check is the one that catches
      // collision.
      expect(keysA).toEqual(['shared.key']);
      expect(keysB).toEqual(['shared.key']);

      const boundA = await exchangeInstance.getRoutingKeyBoundQueues(
        exchangeA,
        'shared.key',
      );
      const boundB = await exchangeInstance.getRoutingKeyBoundQueues(
        exchangeB,
        'shared.key',
      );

      expect(boundA).toEqual([queueA]);
      expect(boundB).toEqual([queueB]);
    });
  });
});
