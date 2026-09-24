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
 * Integration tests for exact matching on a topic exchange.
 *
 * A topic binding pattern that contains no wildcards (`*` or `#`) is an
 * exact match: the bound queue receives messages published under the
 * pattern's literal routing key and nothing else. The pattern is
 * dot-separated identifiers with no special characters — the same
 * shape a direct exchange's routing key takes, but stored under the
 * topic exchange's pattern-based storage and evaluated by the topic
 * matcher.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * The exact pattern used by most tests. Two tokens, no wildcards.
 */
const EXACT_PATTERN = 'order.created';

/**
 * A key with the same number of tokens as `EXACT_PATTERN` but
 * different content.
 */
const DIFFERENT_KEY_SAME_LENGTH = 'order.cancelled';

/**
 * A key with more tokens than `EXACT_PATTERN`.
 */
const LONGER_KEY = 'order.created.eu';

/**
 * A key with fewer tokens than `EXACT_PATTERN`.
 */
const SHORTER_KEY = 'order';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExchangeTopic — exact match', () => {
  // -------------------------------------------------------------------------
  // Positive
  // -------------------------------------------------------------------------

  describe('matching', () => {
    it('matches the identical routing key', async () => {
      // The baseline. A pattern with no wildcards matches the key
      // that spells the same tokens in the same positions.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-exact-hit');

      await exchangeInstance.bindQueue(queue, exchange, EXACT_PATTERN);

      const matched = await exchangeInstance.matchQueues(
        exchange,
        EXACT_PATTERN,
      );

      expect(matched).toEqual([queue]);
    });

    it('matches every queue bound under the same exact pattern', async () => {
      const { exchange, exchangeInstance } =
        await makeTopicFixture('top-exact-multi');

      const [queueA, queueB] = await makeQueues('top-exact-multi-q', 2);

      await exchangeInstance.bindQueue(queueA, exchange, EXACT_PATTERN);
      await exchangeInstance.bindQueue(queueB, exchange, EXACT_PATTERN);

      const matched = await exchangeInstance.matchQueues(
        exchange,
        EXACT_PATTERN,
      );

      expect(sortQueues(matched)).toEqual(sortQueues([queueA, queueB]));
    });

    it('matches each of a queue\u2019s exact patterns independently', async () => {
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-exact-two-patterns',
      );

      const patternA = 'order.created';
      const patternB = 'order.cancelled';

      await exchangeInstance.bindQueue(queue, exchange, patternA);
      await exchangeInstance.bindQueue(queue, exchange, patternB);

      const matchA = await exchangeInstance.matchQueues(exchange, patternA);
      const matchB = await exchangeInstance.matchQueues(exchange, patternB);

      expect(matchA).toEqual([queue]);
      expect(matchB).toEqual([queue]);
    });
  });

  // -------------------------------------------------------------------------
  // Negative
  // -------------------------------------------------------------------------

  describe('non-matching', () => {
    it('does not match a key with different tokens', async () => {
      const { queue, exchange, exchangeInstance } = await makeTopicFixture(
        'top-exact-different',
      );

      await exchangeInstance.bindQueue(queue, exchange, EXACT_PATTERN);

      // Sanity: the exact key matches, so the exchange is not simply
      // returning empty for every key.
      const matched = await exchangeInstance.matchQueues(
        exchange,
        EXACT_PATTERN,
      );
      expect(matched).toEqual([queue]);

      const notMatched = await exchangeInstance.matchQueues(
        exchange,
        DIFFERENT_KEY_SAME_LENGTH,
      );
      expect(notMatched).toEqual([]);
    });

    it('does not match a longer routing key', async () => {
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-exact-longer');

      await exchangeInstance.bindQueue(queue, exchange, EXACT_PATTERN);

      const notMatched = await exchangeInstance.matchQueues(
        exchange,
        LONGER_KEY,
      );

      expect(notMatched).toEqual([]);
    });

    it('does not match a shorter routing key', async () => {
      // The bound pattern has two tokens; the routing key has one. The
      // extra pattern token means the key is not the pattern's literal
      // value.
      //
      // A regression where the matcher compared only the tokens the
      // key provided — treating the pattern as "at least these tokens,
      // in order" rather than "exactly these tokens" — would pass this
      // case as a match.
      const { queue, exchange, exchangeInstance } =
        await makeTopicFixture('top-exact-shorter');

      await exchangeInstance.bindQueue(queue, exchange, EXACT_PATTERN);

      const notMatched = await exchangeInstance.matchQueues(
        exchange,
        SHORTER_KEY,
      );

      expect(notMatched).toEqual([]);
    });

    it('does not match when no queue is bound under the pattern', async () => {
      const { exchange, exchangeInstance } =
        await makeTopicFixture('top-exact-empty');

      const [queue] = await makeQueues('top-exact-empty-q', 1);
      await exchangeInstance.bindQueue(queue, exchange, 'payment.*');

      const matched = await exchangeInstance.matchQueues(
        exchange,
        EXACT_PATTERN,
      );

      expect(matched).toEqual([]);
    });
  });
});
