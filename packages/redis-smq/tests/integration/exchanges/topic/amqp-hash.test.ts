/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { makeTopicFixture } from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for the AMQP `#` wildcard on a topic exchange.
 *
 * A topic binding pattern is a sequence of dot-separated tokens. The
 * `#` wildcard is a token that matches zero or more consecutive tokens
 * in the routing key at the same position. The semantic is precise:
 * "zero or more", not "one or more" — the `#` is optional and can
 * stand for nothing.
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeTopic — AMQP # wildcard', () => {
  // -------------------------------------------------------------------------
  // Trailing #
  // -------------------------------------------------------------------------

  describe('trailing #', () => {
    it.each<[string, string, boolean]>([
      ['matches with zero tokens after the literal', 'order', true],
      ['matches with one token after the literal', 'order.created', true],
      ['matches with two tokens after the literal', 'order.created.eu', true],
      [
        'matches with four tokens after the literal',
        'order.created.eu.west.region',
        true,
      ],
      ['does not match when the literal is absent', 'payment.created', false],
      [
        'does not match a key that does not start with the literal',
        'orders',
        false,
      ],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `order.#` — the `#` absorbs any number of tokens after the
      // `order` prefix. The two negative cases confirm the leading
      // literal is still required: a key that does not begin with
      // `order` does not match, no matter how many tokens it has.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-hash-trailing');

      await exchangeInstance.bindQueue(queue, exchange, 'order.#');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Leading #
  // -------------------------------------------------------------------------

  describe('leading #', () => {
    it.each<[string, string, boolean]>([
      ['matches with zero tokens before the literal', 'created', true],
      ['matches with one token before the literal', 'order.created', true],
      ['matches with two tokens before the literal', 'order.vip.created', true],
      [
        'matches with four tokens before the literal',
        'user.orders.vip.created',
        true,
      ],
      ['does not match when the literal is absent', 'order', false],
      [
        'does not match a key that does not end with the literal',
        'created.eu',
        false,
      ],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `#.created` — the `#` absorbs any number of tokens before the
      // `created` suffix. The two negative cases confirm the trailing
      // literal is still required.
      //
      // The "zero tokens before" case is the one that distinguishes
      // `#` from `*` in the leading position: `*.created` would not
      // match `created` alone (the key is too short), but `#.created`
      // does.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-hash-leading');

      await exchangeInstance.bindQueue(queue, exchange, '#.created');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Middle #
  // -------------------------------------------------------------------------

  describe('# in the middle', () => {
    it.each<[string, string, boolean]>([
      ['matches with zero tokens in the middle', 'order.created', true],
      ['matches with one token in the middle', 'order.vip.created', true],
      ['matches with two tokens in the middle', 'order.vip.item.created', true],
      [
        'matches with four tokens in the middle',
        'order.vip.item.electronics.created',
        true,
      ],
      [
        'does not match when the trailing literal is absent',
        'order.vip',
        false,
      ],
      [
        'does not match when the leading literal is absent',
        'vip.created',
        false,
      ],
      [
        'does not match when the trailing literal differs',
        'order.vip.updated',
        false,
      ],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `order.#.created` — the `#` absorbs any number of tokens
      // between the `order` prefix and the `created` suffix. The three
      // negative cases confirm both surrounding literals are required
      // and that the trailing literal is an exact token.
      //
      // The "zero tokens in the middle" case is the one that
      // distinguishes `#` in the middle from `*` in the middle:
      // `order.*.created` would not match `order.created`, but
      // `order.#.created` does.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-hash-middle');

      await exchangeInstance.bindQueue(queue, exchange, 'order.#.created');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Multiple # in one pattern
  // -------------------------------------------------------------------------

  describe('multiple # in one pattern', () => {
    it.each<[string, string, boolean]>([
      ['matches with both wildcards empty', 'a.b', true],
      ['matches with the first wildcard empty', 'a.middle.b', true],
      ['matches with the second wildcard empty', 'a.first.middle.b', true],
      ['matches with both wildcards non-empty', 'a.x.y.b', true],
      ['matches with both wildcards multi-token', 'a.p.q.r.s.b', true],
      ['does not match when the leading literal is absent', 'x.b', false],
      ['does not match when the trailing literal is absent', 'a.x', false],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `a.#.#.b` — two `#` tokens between the `a` prefix and the `b`
      // suffix. Each `#` absorbs any number of tokens independently
      // and can be empty.
      //
      // The empty/mixed cases confirm the wildcards do not have to
      // partition the middle tokens equally: the matcher must find
      // *some* partition where the pattern's literals align.
      //
      // A regression where the matcher required each `#` to absorb at
      // least one token would fail the "both wildcards empty" case.
      // A regression where the matcher greedily assigned all tokens
      // to the first `#` and left the second with nothing would fail
      // the "both non-empty" case.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-hash-multiple');

      await exchangeInstance.bindQueue(queue, exchange, 'a.#.#.b');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // # as the whole pattern
  // -------------------------------------------------------------------------

  describe('# as the whole pattern', () => {
    it.each<[string, string, boolean]>([
      ['matches a one-token key', 'anything', true],
      ['matches a two-token key', 'a.b', true],
      ['matches a five-token key', 'a.b.c.d.e', true],
      ['matches a numeric key', '123', true],
      ['matches a numeric multi-token key', '1.2.3', true],
    ])('%s', async (_label, routingKey) => {
      // A pattern that is just `#` matches every routing key,
      // regardless of its token count. Both `#` wildcards — the
      // leading and the trailing — can be empty, and a lone `#` has
      // no surrounding literals to align.
      //
      // The test does not include a negative case because there is
      // none: a lone `#` accepts every valid key. If a case ever
      // failed, the failure would point at the tokenizer rejecting
      // an input that should have been accepted.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-hash-whole');

      await exchangeInstance.bindQueue(queue, exchange, '#');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      expect(matched).toEqual([queue]);
    });
  });

  // -------------------------------------------------------------------------
  // # is not *
  // -------------------------------------------------------------------------

  describe('# is not *', () => {
    it('matches zero tokens at the wildcard position', async () => {
      // The complementary cross-check to the one in `amqp-star.test.ts`.
      // `*` must not match zero tokens; `#` must. A regression that
      // swapped the two wildcards' implementations would pass every
      // test in this file except this one — because every other case
      // here is consistent with `#` matching "any number", and the
      // failure mode is specifically the zero case.
      //
      // `order.#` with `order` as the routing key: the `#` matches
      // zero tokens, so the pattern matches. Under a `*`
      // implementation, the key would be too short and the pattern
      // would not match.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-hash-not-star');

      await exchangeInstance.bindQueue(queue, exchange, 'order.#');

      const matched = await exchangeInstance.matchQueues(exchange, 'order');
      expect(matched).toEqual([queue]);
    });
  });
});
