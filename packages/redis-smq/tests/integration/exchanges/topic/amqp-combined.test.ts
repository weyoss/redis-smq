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
 * Integration tests for patterns mixing the AMQP `*` and `#` wildcards.
 *
 * A topic binding pattern can combine the two wildcards in a single
 * expression. Each wildcard keeps its own semantic — `*` matches
 * exactly one token, `#` matches zero or more — but the pattern as a
 * whole has to reconcile both when matching a routing key.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeTopic — combined * and #', () => {
  // -------------------------------------------------------------------------
  // * before #
  // -------------------------------------------------------------------------

  describe('* before #', () => {
    it.each<[string, string, boolean]>([
      ['matches with one fixed token and one variable token', 'a.x.b.y', true],
      [
        'matches with one fixed token and several variable tokens',
        'a.x.b.y.z',
        true,
      ],
      ['does not match when the * has no token', 'a.b.y', false],
      [
        'does not match when the literal before the * is absent',
        'x.b.y',
        false,
      ],
      [
        'does not match when the literal between them is absent',
        'a.x.y',
        false,
      ],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `a.*.b.#` — a literal, a `*` (exactly one token), a literal,
      // and a `#` (zero or more tokens) at the end.
      //
      // The positive cases show the two wildcards coexisting: the `*`
      // takes exactly one token (`x` in the examples), the `#` takes
      // whatever remains after the literal `b`.
      //
      // The three negative cases test alignment with each literal in
      // turn — the leading `a`, the middle `b` — plus the length
      // requirement imposed by the `*`.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-combined-star-hash',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'a.*.b.#');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // # before *
  // -------------------------------------------------------------------------

  describe('# before *', () => {
    it.each<[string, string, boolean]>([
      ['matches with zero tokens before the literal', 'b.x', true],
      ['matches with one token before the literal', 'a.b.x', true],
      ['matches with two tokens before the literal', 'a.a.b.x', true],
      ['does not match when the * has no token', 'a.b', false],
      ['does not match when the trailing literal is absent', 'b.x.y', false],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `#.b.*` — a `#` at the front (zero or more tokens), a
      // literal `b`, and a `*` at the end (exactly one token).
      //
      // The interaction is the mirror of the previous block: the `#`
      // absorbs arbitrarily many tokens, the `*` takes exactly one
      // final token, and the literal `b` anchors the transition
      // between them.
      //
      // The "does not match when the * has no token" case is the one
      // that catches a matcher that treats `*` as `#` — the key `a.b`
      // would match `#.b.#` (since the second `#` matches zero
      // tokens) but must not match `#.b.*`.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-combined-hash-star',
      );

      await exchangeInstance.bindQueue(queue, exchange, '#.b.*');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // # between two *
  // -------------------------------------------------------------------------

  describe('# between two *', () => {
    it.each<[string, string, boolean]>([
      ['matches with zero tokens between the * and *', 'a.x.y.z', true],
      ['matches with one token between the * and *', 'a.x.mid.y.z', true],
      ['matches with three tokens between the * and *', 'a.x.p.q.r.y.z', true],
      ['does not match when the leading * has no token', 'x.y.z', false],
      ['does not match when the trailing * has no token', 'a.x.y', false],
      ['does not match when both * are missing tokens', 'a', false],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // Pattern: `*.x.#.y.*` — two `*` (each exactly one token), two
      // literals `x` and `y`, and a `#` between them.
      //
      // Fixed tokens: `*`, `x`, `y`, `*` — four positions the key
      // must fill. The `#` absorbs whatever remains between the
      // literal `y` and the position before the trailing `*`.
      //
      // Minimum matching key length: 4 tokens (the `#` empty). Each
      // additional token the key carries must be absorbed by the `#`.
      //
      // Key layout for the positive cases:
      //
      //   a.x.y.z           * → a, x → x, # → empty, y → y, * → z
      //   a.x.mid.y.z       * → a, x → x, # → mid,   y → y, * → z
      //   a.x.p.q.r.y.z     * → a, x → x, # → p.q.r, y → y, * → z
      //
      // A recursive matcher's backtracking is stressed by the middle
      // case in particular: the `#` must consume `mid` and stop at
      // the literal `y`, without consuming `y` or `z`.
      //
      // The three negative cases each test a different missing-token
      // position: the leading `*`, the trailing `*`, and both at once.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-combined-star-hash-star',
      );

      await exchangeInstance.bindQueue(queue, exchange, '*.x.#.y.*');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Side-by-side * vs # at the same position
  // -------------------------------------------------------------------------

  describe('side-by-side * vs #', () => {
    it('distinguishes order.*.created from order.#.created for the same keys', async () => {
      // The minimal distinguishing case. Two patterns differ by one
      // character — `*` versus `#` in the second position — and are
      // bound to two different queues on the same exchange. The same
      // routing key is looked up, and the two queues see different
      // match results depending on which wildcard their pattern
      // contains.
      //
      // The three keys test the three boundary cases:
      //
      //   order.created          — the * must not match zero tokens
      //                            (queueStar should not match);
      //                            the # must match zero tokens
      //                            (queueHash should match).
      //   order.vip.created      — both should match (the * matches
      //                            one token, the # matches one token).
      //   order.vip.item.created — the * must not match two tokens
      //                            (queueStar should not match);
      //                            the # matches two tokens
      //                            (queueHash should match).
      //
      // The assertions compare sorted arrays rather than using
      // `toContain(queue)` — `matchQueues` returns fresh objects from
      // Redis, so a reference-based `toContain` would fail even when
      // the correct queue is in the result. Sorting both sides makes
      // the comparison structural.
      const { exchange, exchangeInstance } = await makeTopicFixture(
        'top-combined-side-by-side',
      );

      const [queueStar, queueHash] = await makeQueues(
        'top-combined-side-by-side-q',
        2,
      );

      await exchangeInstance.bindQueue(queueStar, exchange, 'order.*.created');
      await exchangeInstance.bindQueue(queueHash, exchange, 'order.#.created');

      // Case 1: `order.created` — no middle token.
      //   - `order.*.created` should not match (the * needs one token).
      //   - `order.#.created` should match (the # matches zero).
      const case1 = await exchangeInstance.matchQueues(
        exchange,
        'order.created',
      );
      expect(case1).toEqual([queueHash]);

      // Case 2: `order.vip.created` — one middle token.
      //   - Both patterns should match.
      const case2 = await exchangeInstance.matchQueues(
        exchange,
        'order.vip.created',
      );
      expect(sortQueues(case2)).toEqual(sortQueues([queueStar, queueHash]));

      // Case 3: `order.vip.item.created` — two middle tokens.
      //   - `order.*.created` should not match (the * needs exactly one).
      //   - `order.#.created` should match (the # matches two).
      const case3 = await exchangeInstance.matchQueues(
        exchange,
        'order.vip.item.created',
      );
      expect(case3).toEqual([queueHash]);
    });
  });

  // -------------------------------------------------------------------------
  // Trailing mixed wildcards
  // -------------------------------------------------------------------------

  describe('trailing mixed wildcards', () => {
    it.each<[string, string, boolean]>([
      ['matches one trailing token', 'a.x', true],
      ['matches two trailing tokens', 'a.x.y', true],
      ['matches three trailing tokens', 'a.x.y.z', true],
      ['does not match zero trailing tokens', 'a', false],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `a.#.*` — a leading literal, then any number of tokens, then
      // exactly one token at the end.
      //
      // The pattern's contribution is that the trailing `*` requires
      // at least one token at the end. A key of just `a` has no
      // trailing token, so it fails — a case that a matcher treating
      // the `*` as "zero or more" would incorrectly accept.
      //
      // This is the trailing counterpart to the leading `*.#` case
      // above (which the tests exercise in the `#` before `*`
      // block).
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-combined-trailing',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'a.#.*');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Leading mixed wildcards
  // -------------------------------------------------------------------------

  describe('leading mixed wildcards', () => {
    it.each<[string, string, boolean]>([
      ['matches one leading token', 'x.b', true],
      ['matches two leading tokens', 'x.y.b', true],
      ['matches three leading tokens', 'x.y.z.b', true],
      ['does not match zero leading tokens', 'b', false],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `*.#.b` — exactly one token, then any number of tokens, then
      // the literal `b`.
      //
      // The leading `*` requires at least one token at the start. A
      // key of just `b` has no leading token, so it fails. This is
      // the leading counterpart to the trailing case above.
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-combined-leading',
      );

      await exchangeInstance.bindQueue(queue, exchange, '*.#.b');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });
});
