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
import { makeDirectFixture } from '../../../helpers/factories/exchange.js';

/**
 * Integration tests for direct-exchange routing key validation.
 *
 * A direct exchange matches on exact routing keys. RedisSMQ
 * validates a key before using it, and the validation rules differ
 * between the operations that consume the key:
 *
 *   - `bindQueue` and `unbindQueue` — the key is being *written* to or
 *     removed from the exchange's storage, so it must satisfy the
 *     identifier-style rules the storage uses. Rejection is
 *     `InvalidDirectExchangeParametersError`.
 *
 *   - `matchQueues` — the key is being *looked up*, and the lookup
 *     uses a looser check. Rejection is
 *     `InvalidExchangeRoutingKeyError`.
 *
 * The two error classes are the caller-facing contract: a caller who
 * catches by class can tell whether the failure came from a write path
 * or a lookup path. The tests below assert each class against the
 * operations that produce it.
 */

/**
 * A representative sample of routing keys that RedisSMQ rejects.
 *
 * One entry per category of invalid input. The label names the
 * category so a failure in the table-driven test identifies which kind
 * of validation broke, rather than just which character.
 */
const INVALID_ROUTING_KEYS: readonly [string, string][] = [
  ['empty string', ''],
  ['whitespace only (space)', ' '],
  ['whitespace only (tab)', '\t'],
  ['whitespace only (newline)', '\n'],
  ['internal space', 'order created'],
  ['leading digit', '0'],
  ['leading digit sequence', '1234'],
  ['forward slash', 'order/created'],
  ['backslash', 'order\\created'],
  ['colon', 'order:created'],
  ['star wildcard', 'order*created'],
  ['hash wildcard', 'order#created'],
  ['square brackets', 'order[created]'],
  ['non-ASCII (Cyrillic)', 'ключ'],
  ['non-ASCII (accented Latin)', 'föö'],
];

/**
 * A representative sample of routing keys that RedisSMQ accepts.
 *
 * Covers the four shapes RedisSMQ's routing keys take: single
 * letters, hyphenated identifiers, dotted multi-segment keys, and
 * mixed-case keys with separators.
 */
const VALID_ROUTING_KEYS: readonly [string, string][] = [
  ['single lowercase letter', 'a'],
  ['single uppercase letter', 'A'],
  ['hyphen-separated identifiers', 'a-b'],
  ['underscore-separated identifiers', 'a_b'],
  ['dotted identifiers', 'a.b'],
  ['mixed separators', 'A-1_2.3'],
  ['typical dotted key', 'order.created'],
  ['key with digits and hyphens', 'payment_v2-updated'],
  ['mixed-case with separators', 'USER_123.ACTION-456'],
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeDirect — routing key validation', () => {
  // -------------------------------------------------------------------------
  // Invalid keys, by operation
  // -------------------------------------------------------------------------

  describe('bindQueue rejects invalid routing keys', () => {
    it.each(INVALID_ROUTING_KEYS)('rejects %s', async (_label, key) => {
      const { queue, exchange, exchangeInstance } =
        await makeDirectFixture('dir-rk-bind');

      await expect(
        exchangeInstance.bindQueue(queue, exchange, key),
      ).rejects.toThrow(errors.InvalidDirectExchangeParametersError);
    });
  });

  describe('unbindQueue rejects invalid routing keys', () => {
    it.each(INVALID_ROUTING_KEYS)('rejects %s', async (_label, key) => {
      const { queue, exchange, exchangeInstance } =
        await makeDirectFixture('dir-rk-unbind');

      await expect(
        exchangeInstance.unbindQueue(queue, exchange, key),
      ).rejects.toThrow(errors.InvalidDirectExchangeParametersError);
    });
  });

  describe('matchQueues rejects invalid routing keys', () => {
    it.each(INVALID_ROUTING_KEYS)('rejects %s', async (_label, key) => {
      const { exchange, exchangeInstance } =
        await makeDirectFixture('dir-rk-match');

      await expect(exchangeInstance.matchQueues(exchange, key)).rejects.toThrow(
        errors.InvalidExchangeRoutingKeyError,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Valid keys
  // -------------------------------------------------------------------------

  describe('all operations accept valid routing keys', () => {
    it.each(VALID_ROUTING_KEYS)(
      'accepts %s across bind, match, and unbind',
      async (_label, key) => {
        const { queue, exchange, exchangeInstance } =
          await makeDirectFixture('dir-rk-valid');

        // Bind.
        await expect(
          exchangeInstance.bindQueue(queue, exchange, key),
        ).resolves.toBeUndefined();

        // Match. The match result should include the bound queue.
        const matched = await exchangeInstance.matchQueues(exchange, key);
        expect(matched).toEqual([queue]);

        // Unbind.
        await expect(
          exchangeInstance.unbindQueue(queue, exchange, key),
        ).resolves.toBeUndefined();

        // After unbind, the binding is gone.
        const afterUnbind = await exchangeInstance.matchQueues(exchange, key);
        expect(afterUnbind).toEqual([]);
      },
    );
  });
});
