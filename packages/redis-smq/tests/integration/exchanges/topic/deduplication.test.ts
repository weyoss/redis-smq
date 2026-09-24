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
  makeQueues,
  makeTopicFixture,
  sortQueues,
} from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for match de-duplication on a topic exchange.
 *
 * `matchQueues(exchange, routingKey)` returns the set of queues that
 * should receive a message published under `routingKey`. A queue can
 * be bound to the exchange under more than one pattern, and more than
 * one of those patterns can match the same routing key — `order.#` and
 * `order.*` both match `order.created`, for example.
 *
 * RedisSMQ's contract is that the result is a *set of queues*, not
 * a set of bindings. A queue whose patterns all match a given routing
 * key appears exactly once in the result, and the message is delivered
 * to it once.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeTopic — match de-duplication', () => {
  // -------------------------------------------------------------------------
  // A queue with multiple matching patterns
  // -------------------------------------------------------------------------

  describe('one queue, multiple matching patterns', () => {
    it('appears once in the match result when two patterns both match the key', async () => {
      // `order.*` matches `order.created` (one token after the
      // prefix); `order.#` also matches it (the `#` absorbs one
      // token). Both patterns are bound to the same queue, so the
      // queue is the target of two bindings — but the match result
      // contains it once.
      //
      // The assertion uses `toEqual([queue])` rather than
      // `toContain(queue)` because the length matters: a result of
      // `[queue, queue]` would satisfy `toContain` but violate the
      // set contract.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-dedup-one');

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');
      await exchangeInstance.bindQueue(queue, exchange, 'order.#');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );

      expect(matched).toEqual([queue]);
    });

    it('appears once when three patterns all match the same key', async () => {
      // Three overlapping patterns — `order.*`, `order.#`, and the
      // exact `order.created` — all match the same key. A regression
      // that de-duplicated pairwise (say, by comparing adjacent
      // entries) rather than against the full set would pass the
      // two-pattern case above and fail here with three entries.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-dedup-three');

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');
      await exchangeInstance.bindQueue(queue, exchange, 'order.#');
      await exchangeInstance.bindQueue(queue, exchange, 'order.created');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );

      expect(matched).toEqual([queue]);
    });

    it('appears once when both patterns match a longer key', async () => {
      // The same overlap on a key where `*` is not involved: `order.#`
      // and `order.#.created` both match `order.vip.created`. The
      // dedup contract applies regardless of which specific wildcards
      // are in play.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-dedup-hash-overlap',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'order.#');
      await exchangeInstance.bindQueue(queue, exchange, 'order.#.created');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.vip.created',
      );

      expect(matched).toEqual([queue]);
    });

    it('does not de-duplicate a queue whose patterns match different keys', async () => {
      // The negative control: a queue with two patterns that match
      // *different* routing keys is not conflated. The queue is
      // reachable via either pattern, but each lookup returns it
      // exactly once because only one pattern matches each key.
      //
      // A regression where RedisSMQ deduplicated bindings at
      // bind time rather than at match time — say, by keeping only
      // the "most general" pattern — would make one of the two
      // lookups fail.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-dedup-distinct');

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');
      await exchangeInstance.bindQueue(queue, exchange, 'payment.*');

      const orderMatch = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );
      const paymentMatch = await exchangeInstance.matchQueues(
        exchange,
        'payment.processed',
      );

      expect(orderMatch).toEqual([queue]);
      expect(paymentMatch).toEqual([queue]);
    });
  });

  // -------------------------------------------------------------------------
  // Multiple queues with overlapping patterns
  // -------------------------------------------------------------------------

  describe('multiple queues', () => {
    it('each appears once when they share a matching pattern', async () => {
      // Two queues bound under the same pattern. Both match, each
      // once. This is the simplest multi-queue case, included as the
      // baseline before the more complex overlap.
      const { exchange, exchangeInstance } = await makeTopicFixture(
        'top-dedup-two-shared',
      );

      const [queueA, queueB] = await makeQueues('top-dedup-two-shared-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'order.*');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );

      expect(sortQueues(matched)).toEqual(sortQueues([queueA, queueB]));
    });

    it('each appears once when each has its own multiple matching patterns', async () => {
      // The most demanding de-duplication case: two queues, each
      // bound under two patterns, and all four bindings match the
      // same routing key. The result is the set of queues — two
      // entries — not the set of bindings.
      //
      // A regression where RedisSMQ deduplicated within each
      // queue but not across them, or vice versa, would show up here
      // with the wrong cardinality: three entries (one queue's
      // bindings collapsed, the other's not) or four (nothing
      // collapsed).
      //
      // The setup:
      //   queueA bound under `order.*` and `order.#`
      //   queueB bound under `order.*` and `order.#`
      // Both patterns in each case match `order.created`, so all
      // four bindings are candidates — the result must be
      // `{queueA, queueB}`.
      const { exchange, exchangeInstance } =
        await makeTopicFixture('top-dedup-cross');

      const [queueA, queueB] = await makeQueues('top-dedup-cross-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueA, exchange, 'order.#');
      await exchangeInstance.bindQueue(queueB, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueB, exchange, 'order.#');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );

      expect(sortQueues(matched)).toEqual(sortQueues([queueA, queueB]));
    });

    it('includes queues whose exact-match pattern also matches', async () => {
      // Three queues with different pattern kinds that all match the
      // same key:
      //   queueA bound under `order.created` (exact)
      //   queueB bound under `order.*` (star)
      //   queueC bound under `order.#` (hash)
      // All three appear once. This confirms the dedup does not
      // accidentally exclude a queue based on which kind of pattern
      // matched it.
      const { exchange, exchangeInstance } = await makeTopicFixture(
        'top-dedup-mixed-kinds',
      );

      const [queueA, queueB, queueC] = await makeQueues(
        'top-dedup-mixed-kinds-q',
        3,
      );

      await exchangeInstance.bindQueue(queueA, exchange, 'order.created');
      await exchangeInstance.bindQueue(queueB, exchange, 'order.*');
      await exchangeInstance.bindQueue(queueC, exchange, 'order.#');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );

      expect(sortQueues(matched)).toEqual(sortQueues([queueA, queueB, queueC]));
    });
  });

  // -------------------------------------------------------------------------
  // Unbind preserves the dedup contract
  // -------------------------------------------------------------------------

  describe('unbind with overlapping patterns', () => {
    it('keeps the queue in the match result while another matching pattern remains', async () => {
      // A queue bound under two overlapping patterns. Unbind one. The
      // queue remains reachable via the other, so it still appears in
      // the match result.
      //
      // This is the unbind counterpart to the dedup contract: the
      // result is determined by the *remaining* bindings, and as long
      // as at least one matches, the queue is present.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-dedup-unbind-keep',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');
      await exchangeInstance.bindQueue(queue, exchange, 'order.#');

      // Confirm the pre-state: both patterns are bound and the queue
      // appears once.
      const before = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );
      expect(before).toEqual([queue]);

      // Unbind one of the two matching patterns.
      await exchangeInstance.unbindQueue(queue, exchange, 'order.*');

      // The queue is still reachable via `order.#`.
      const afterFirstUnbind = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );
      expect(afterFirstUnbind).toEqual([queue]);

      // A regression where the unbind removed the queue from the
      // match result entirely — say, by treating the unbind as
      // "forget this queue" rather than "remove one binding" — would
      // produce an empty result here.
    });

    it('removes the queue from the match result once the last matching pattern is unbound', async () => {
      // The complementary case: unbind both matching patterns. The
      // queue is no longer reachable via this key.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-dedup-unbind-all',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');
      await exchangeInstance.bindQueue(queue, exchange, 'order.#');

      await exchangeInstance.unbindQueue(queue, exchange, 'order.*');
      await exchangeInstance.unbindQueue(queue, exchange, 'order.#');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );
      expect(matched).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // The pattern list is not affected by match de-duplication
  // -------------------------------------------------------------------------

  describe('pattern list vs. match result', () => {
    it('getRoutingPatterns lists every distinct pattern, not the match result', async () => {
      // `getRoutingPatterns(exchange)` reports which patterns the
      // exchange has bindings for. It is not the same as the match
      // result — the match result is a set of queues, the pattern
      // list is a set of patterns.
      //
      // A queue bound under two patterns that happen to overlap for
      // some routing key contributes *two* entries to the pattern
      // list even though it contributes one entry to the match
      // result for the overlapping key. The two accessors answer
      // different questions and must not be conflated.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-dedup-pattern-list',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');
      await exchangeInstance.bindQueue(queue, exchange, 'order.#');

      // The match result is one entry.
      const matched = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );
      expect(matched).toEqual([queue]);

      // The pattern list is two entries.
      const patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect([...patterns].sort()).toEqual(['order.#', 'order.*']);
    });

    it('getRoutingPatternBoundQueues returns the queue for each pattern independently', async () => {
      // `getRoutingPatternBoundQueues(exchange, pattern)` is scoped to
      // a single pattern. Even when the same queue is bound under two
      // overlapping patterns, each pattern's queue list contains the
      // queue independently — the match result's dedup does not
      // propagate to this accessor.
      //
      // A regression where the two overlapping patterns shared
      // storage (say, because RedisSMQ de-duplicated them at
      // bind time) would make one of the two lookups return an empty
      // list.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-dedup-per-pattern-queues',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');
      await exchangeInstance.bindQueue(queue, exchange, 'order.#');

      const queuesUnderStar =
        await exchangeInstance.getRoutingPatternBoundQueues(
          exchange,
          'order.*',
        );
      const queuesUnderHash =
        await exchangeInstance.getRoutingPatternBoundQueues(
          exchange,
          'order.#',
        );

      expect(queuesUnderStar).toEqual([queue]);
      expect(queuesUnderHash).toEqual([queue]);
    });
  });
});
