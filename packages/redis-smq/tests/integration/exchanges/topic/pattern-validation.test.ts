/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import { errors } from '../../../../src/index.js';
import { makeTopicFixture } from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for topic binding pattern validation.
 *
 * A topic binding pattern is a sequence of dot-separated tokens. Each
 * token is either a literal identifier (letters, digits, hyphen,
 * underscore) or one of the two AMQP wildcards, `*` or `#`. A wildcard
 * must occupy an entire token — a token like `ord*er` that mixes a
 * wildcard with literal characters is invalid.
 *
 * The validator runs before the pattern is used, so a rejected bind or
 * unbind leaves the exchange's binding set unchanged. Both operations
 * that accept a pattern reject with the same class:
 * `InvalidTopicBindingPatternError`.
 */

// ---------------------------------------------------------------------------
// Test tables
// ---------------------------------------------------------------------------

/**
 * Invalid binding patterns, one representative per rejection
 * category. The label names the category so a failure in the table
 * identifies which validation rule broke.
 */
const INVALID_PATTERNS: readonly [string, string][] = [
  // Empty / whitespace --------------------------------------------------
  ['empty string', ''],
  ['single space', ' '],
  ['multiple spaces', '   '],
  ['leading whitespace', ' order'],
  ['trailing whitespace', 'order '],
  ['tab', '\t'],
  ['newline', '\n'],

  // Dot rules -----------------------------------------------------------
  ['leading dot', '.order'],
  ['trailing dot', 'order.'],
  ['consecutive dots', 'order..created'],
  ['only a dot', '.'],

  // Wildcards mixed with literals --------------------------------------
  ['star mixed with trailing literal', 'ord*er'],
  ['star mixed with leading literal', '*order'],
  ['star mixed in the middle', 'ord*er.created'],
  ['hash mixed with trailing literal', 'ord#er'],
  ['hash mixed with leading literal', '#order'],
  ['hash mixed in the middle', 'order.#created'],
  ['star and literal in same token', 'order.*created'],
  ['hash and literal in same token', 'order.#created'],

  // Multi-wildcard tokens ----------------------------------------------
  ['two stars in one token', '**'],
  ['two hashes in one token', '##'],
  ['star followed by hash', '*#'],
  ['hash followed by star', '#*'],
  ['two stars in a middle token', 'order.**.created'],
  ['two hashes in a middle token', 'order.##.created'],
  ['mixed wildcards in a middle token', 'order.*#.created'],

  // Forbidden characters in tokens -------------------------------------
  ['space in a token', 'order created'],
  ['forward slash', 'order/created'],
  ['colon in a token', 'order:created'],
  ['backslash', 'order\\created'],
  ['square brackets', 'order[created]'],
  ['parentheses', 'order(created)'],
  ['non-ASCII (Cyrillic)', 'ключ'],
  ['non-ASCII (accented Latin)', 'öö'],
];

/**
 * Valid binding patterns. Each is bound in the acceptance test and
 * then checked by binding and unbinding.
 */
const VALID_PATTERNS: readonly [string, string][] = [
  ['single literal token', 'order'],
  ['single uppercase literal', 'ORDER'],
  ['hyphenated token', 'order-created'],
  ['underscored token', 'order_created'],
  ['two literal tokens', 'order.created'],
  ['three literal tokens', 'order.vip.created'],
  ['star alone', '*'],
  ['hash alone', '#'],
  ['star as a trailing token', 'order.*'],
  ['star as a leading token', '*.created'],
  ['star in the middle', 'order.*.created'],
  ['hash as a trailing token', 'order.#'],
  ['hash as a leading token', '#.created'],
  ['hash in the middle', 'order.#.created'],
  ['two stars', 'a.*.*.b'],
  ['two hashes', 'a.#.#.b'],
  ['star before hash', 'order.*.#'],
  ['hash before star', 'order.#.*'],
  ['stars and hashes combined', '*.order.#.created.*'],
  ['mixed literals and wildcards', 'user.#.profile'],
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeTopic — pattern validation', () => {
  // -------------------------------------------------------------------------
  // bindQueue rejects invalid patterns
  // -------------------------------------------------------------------------

  describe('bindQueue rejects invalid patterns', () => {
    it.each(INVALID_PATTERNS)('rejects %s', async (_label, pattern) => {
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-pv-bind');

      await expect(
        exchangeInstance.bindQueue(queue, exchange, pattern),
      ).rejects.toThrow(errors.InvalidTopicBindingPatternError);
    });

    it("leaves the exchange's binding set unchanged after a rejected bind", async () => {
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-pv-no-mutation');

      // Establish a valid binding.
      await exchangeInstance.bindQueue(queue, exchange, 'order.*');

      // Attempt an invalid bind on the same exchange.
      await expect(
        exchangeInstance.bindQueue(queue, exchange, 'order..created'),
      ).rejects.toThrow(errors.InvalidTopicBindingPatternError);

      // The exchange has exactly one binding, and it is the valid one.
      const patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect(patterns).toEqual(['order.*']);
    });
  });

  // -------------------------------------------------------------------------
  // unbindQueue rejects invalid patterns
  // -------------------------------------------------------------------------

  describe('unbindQueue rejects invalid patterns', () => {
    it.each(INVALID_PATTERNS)('rejects %s', async (_label, pattern) => {
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-pv-unbind');

      await expect(
        exchangeInstance.unbindQueue(queue, exchange, pattern),
      ).rejects.toThrow(errors.InvalidTopicBindingPatternError);
    });

    it("leaves the exchange's binding set unchanged after a rejected unbind", async () => {
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-pv-unbind-no-mutation',
      );

      await exchangeInstance.bindQueue(queue, exchange, 'order.*');

      await expect(
        exchangeInstance.unbindQueue(queue, exchange, 'order..created'),
      ).rejects.toThrow(errors.InvalidTopicBindingPatternError);

      const patterns = await exchangeInstance.getRoutingPatterns(exchange);
      expect(patterns).toEqual(['order.*']);
    });
  });

  // -------------------------------------------------------------------------
  // Valid patterns are accepted
  // -------------------------------------------------------------------------

  describe('accepts valid patterns', () => {
    it.each(VALID_PATTERNS)(
      'accepts %s across bind and unbind',
      async (_label, pattern) => {
        const { queue, exchange, exchangeInstance } =
          await makeTopicFixture('top-pv-valid');

        await expect(
          exchangeInstance.bindQueue(queue, exchange, pattern),
        ).resolves.toBeUndefined();

        await expect(
          exchangeInstance.unbindQueue(queue, exchange, pattern),
        ).resolves.toBeUndefined();
      },
    );
  });
});
