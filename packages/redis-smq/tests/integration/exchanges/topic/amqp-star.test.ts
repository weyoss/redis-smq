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
 * Integration tests for the AMQP `*` wildcard on a topic exchange.
 *
 * A topic binding pattern is a sequence of dot-separated tokens. The
 * `*` wildcard is a token that matches exactly one token in the
 * routing key at the same position. The semantic is precise: "exactly
 * one", not "one or more", and not "zero or more".
 */

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeTopic — AMQP * wildcard', () => {
  // -------------------------------------------------------------------------
  // Trailing *
  // -------------------------------------------------------------------------

  describe('trailing *', () => {
    it.each<[string, string, boolean]>([
      ['matches one trailing token', 'order.created', true],
      ['does not match zero trailing tokens', 'order', false],
      ['does not match two trailing tokens', 'order.created.eu', false],
      ['does not match three trailing tokens', 'order.created.eu.west', false],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `order.*` — the `*` is at position 2, and the routing key
      // must have exactly two tokens for a match.
      //
      // The four cases bracket the correct token count on both sides:
      // one too few, exactly right, and two too many. A matcher that
      // used `#` semantics — zero or more — would incorrectly match
      // `order`. A matcher that used prefix semantics would
      // incorrectly match the longer keys.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-star-trailing');

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Leading *
  // -------------------------------------------------------------------------

  describe('leading *', () => {
    it.each<[string, string, boolean]>([
      ['matches one leading token', 'user.created', true],
      [
        'matches one leading token with different content',
        'admin.created',
        true,
      ],
      ['does not match zero leading tokens', 'created', false],
      ['does not match two leading tokens', 'user.admin.created', false],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `*.created` — the `*` is at position 1, and the routing key
      // must have exactly two tokens with the second being
      // `created`.
      //
      // The "different content" case is important here: a matcher
      // that compared `*` against the literal first token of the
      // pattern (rather than treating it as a wildcard) would pass
      // the first case — because `user` happens to match — and fail
      // the second.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-star-leading');

      await exchangeInstance.bindQueue(queue, exchange, '*.created');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Middle *
  // -------------------------------------------------------------------------

  describe('* in the middle', () => {
    it.each<[string, string, boolean]>([
      ['matches with a middle token', 'order.vip.created', true],
      ['matches with a different middle token', 'order.standard.created', true],
      ['does not match without a middle token', 'order.created', false],
      [
        'does not match with two middle tokens',
        'order.vip.item.created',
        false,
      ],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `order.*.created` — the `*` is at position 2, between two
      // literal tokens. The key must have exactly three tokens, with
      // the first and third matching the pattern's literals.
      //
      // The "different middle token" case rules out a matcher that
      // compared `*` as the literal token from the first test.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-star-middle');

      await exchangeInstance.bindQueue(queue, exchange, 'order.*.created');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Multiple * in one pattern
  // -------------------------------------------------------------------------

  describe('multiple * in one pattern', () => {
    it.each<[string, string, boolean]>([
      ['matches two distinct middle tokens', 'a.x.y.b', true],
      ['matches with identical middle tokens', 'a.x.x.b', true],
      ['does not match with one middle token', 'a.x.b', false],
      ['does not match with three middle tokens', 'a.x.y.z.b', false],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // `a.*.*.b` — two `*` tokens, each matching exactly one.
      // The pattern has four positions total, so the key must have
      // exactly four tokens.
      //
      // The "identical middle tokens" case confirms the wildcards are
      // independent — the two `*` do not have to match the same
      // value. A matcher that mistakenly required the pattern's
      // wildcards to bind to the same value would fail this case.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-star-multiple');

      await exchangeInstance.bindQueue(queue, exchange, 'a.*.*.b');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // * as the whole pattern
  // -------------------------------------------------------------------------

  describe('* as the whole pattern', () => {
    it.each<[string, string, boolean]>([
      ['matches a one-token key', 'anything', true],
      ['matches a one-token numeric key', '123', true],
      ['does not match a two-token key', 'a.b', false],
      ['does not match a three-token key', 'a.b.c', false],
    ])('%s', async (_label, routingKey, shouldMatch) => {
      // A pattern that is just `*` has one position, so it matches
      // keys with exactly one token. The test uses keys without dots
      // — or with dots — to confirm the matcher splits on the
      // separator, not on some other rule.
      //
      // `123` is included because RedisSMQ's tokenization does
      // not require tokens to be identifiers; any non-separator
      // substring is a token.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-star-whole');

      await exchangeInstance.bindQueue(queue, exchange, '*');

      const matched = await exchangeInstance.matchQueues(exchange, routingKey);

      if (shouldMatch) {
        expect(matched).toEqual([queue]);
      } else {
        expect(matched).toEqual([]);
      }
    });
  });

  // -------------------------------------------------------------------------
  // * does not behave like #
  // -------------------------------------------------------------------------

  describe('* is not #', () => {
    it('does not match a key with zero tokens at the wildcard position', async () => {
      // The most important cross-check in the file: `*` must not
      // behave like `#`. Both wildcards are present in RedisSMQ
      // and a regression that swapped their implementations — an
      // easy copy-paste bug — would make the AMQP-star tests pass for
      // every case except this one.
      //
      // `order.*` with `order` as the routing key: if `*` matched
      // zero tokens, this would be a match. The assertion on `[]`
      // catches the swap.
      //
      // The complementary check (that `#` matches `order` for the
      // pattern `order.#`) is in `amqp-hash.test.ts`.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-star-not-hash');

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');

      const notMatched = await exchangeInstance.matchQueues(exchange, 'order');
      expect(notMatched).toEqual([]);
    });
  });
});
