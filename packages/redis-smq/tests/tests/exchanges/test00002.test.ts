/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  InvalidTopicBindingPatternError,
  NamespaceMismatchError,
} from '../../../src/errors/index.js';
import {
  EQueueType,
  ExchangeTopic,
  IExchangeParams,
  IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue } from '../../common/message-producing-consuming.js';

describe('ExchangeTopic', () => {
  const exchangeA: IExchangeParams = { ns: 'ns1', name: 'exchange1' };
  const exchangeDifferentNs: IExchangeParams = { ns: 'ns2', name: 'exchange2' };

  const queueA: IQueueParams = { ns: 'ns1', name: 'queue1' };
  const queueB: IQueueParams = { ns: 'ns1', name: 'queue2' };

  const rkA = 'order.created';
  const rkB = 'order.cancelled';
  const rkUnknown = 'order.updated';
  const rkOtherDomain = 'payment.created';

  let topicExchange: ReturnType<typeof bluebird.promisifyAll<ExchangeTopic>>;

  beforeEach(async () => {
    // Create queues up-front
    await createQueue(queueA, EQueueType.FIFO_QUEUE);
    await createQueue(queueB, EQueueType.FIFO_QUEUE);
    topicExchange = bluebird.promisifyAll(RedisSMQ.createTopicExchange());
  });

  it('bindQueue: fails when exchange and queue are of different namespaces', async () => {
    await expect(
      topicExchange.bindQueueAsync(queueA, exchangeDifferentNs, rkA),
    ).rejects.toThrow(NamespaceMismatchError);
  });

  it('bindQueue: binds queue with exact pattern and matchQueues returns it', async () => {
    // Bind queueA with an exact topic pattern (no wildcards)
    await topicExchange.bindQueueAsync(queueA, exchangeA, rkA);

    // matchQueues should return queueA for rkA
    const matchedForA = await topicExchange.matchQueuesAsync(exchangeA, rkA);
    expect(matchedForA).toEqual([queueA]);

    // For another key (rkB) it should not return queueA
    const matchedForB = await topicExchange.matchQueuesAsync(exchangeA, rkB);
    expect(matchedForB).toEqual([]);
  });

  it('bindQueue: idempotent when binding the same queue/pattern again', async () => {
    await topicExchange.bindQueueAsync(queueA, exchangeA, rkA);
    // Re-bind the same mapping; should not error
    await topicExchange.bindQueueAsync(queueA, exchangeA, rkA);

    // Still matches
    const matched = await topicExchange.matchQueuesAsync(exchangeA, rkA);
    expect(matched).toEqual([queueA]);
  });

  it('bindQueue: fails when binding a non-existent queue', async () => {
    const nonExistingQueue = `queue-does-not-exist`;
    await expect(
      topicExchange.bindQueueAsync(nonExistingQueue, exchangeA, rkA),
    ).rejects.toBeTruthy();
  });

  it('matchQueues: returns empty array when no bindings match', async () => {
    await topicExchange.bindQueueAsync(queueA, exchangeA, rkA);
    const matched = await topicExchange.matchQueuesAsync(exchangeA, rkUnknown);
    expect(matched).toEqual([]);
  });

  it('unbindQueue: removes binding so matchQueues returns empty for that key', async () => {
    // Ensure queueA is bound to rkA
    await topicExchange.bindQueueAsync(queueA, exchangeA, rkA);
    const matchedBefore = await topicExchange.matchQueuesAsync(exchangeA, rkA);

    expect(matchedBefore).toEqual([queueA]);

    // Unbind and verify
    await topicExchange.unbindQueueAsync(queueA, exchangeA, rkA);
    const matchedAfter = await topicExchange.matchQueuesAsync(exchangeA, rkA);
    expect(matchedAfter).toEqual([]);
  });

  it('deleteExchange: prevents deletion when queues are bound, then deletes when unbound', async () => {
    // Bind queueB with rkB (exact)
    await topicExchange.bindQueueAsync(queueB, exchangeA, rkB);

    // Try deleting while bound -> expect failure
    const tryDeleteWhileBound = topicExchange.deleteAsync(exchangeA);
    await expect(tryDeleteWhileBound).rejects.toBeTruthy();

    // Unbind and then delete
    await topicExchange.unbindQueueAsync(queueB, exchangeA, rkB);
    await topicExchange.deleteAsync(exchangeA);
  });

  it('bindQueue: wildcard pattern matches multiple routing keys', async () => {
    // Bind queueB with a wildcard pattern that should match both rkA and rkB
    await topicExchange.bindQueueAsync(queueB, exchangeA, 'order.*');

    const matchedA = await topicExchange.matchQueuesAsync(exchangeA, rkA);
    expect(matchedA).toEqual([queueB]);

    const matchedB = await topicExchange.matchQueuesAsync(exchangeA, rkB);
    expect(matchedB).toEqual([queueB]);

    // Should not match different domain
    const matchedOther = await topicExchange.matchQueuesAsync(
      exchangeA,
      rkOtherDomain,
    );
    expect(matchedOther).toEqual([]);
  });

  it('AMQP * matches exactly one token', async () => {
    const ex: IExchangeParams = { ns: 'ns1', name: 'ex_star_one_token' };
    await topicExchange.bindQueueAsync(queueA, ex, 'user.*');

    // Matches with exactly one token after 'user'
    await expect(
      topicExchange.matchQueuesAsync(ex, 'user.created'),
    ).resolves.toEqual([queueA]);

    // Does not match zero tokens
    await expect(topicExchange.matchQueuesAsync(ex, 'user')).resolves.toEqual(
      [],
    );

    // Does not match more than one token
    await expect(
      topicExchange.matchQueuesAsync(ex, 'user.created.extra'),
    ).resolves.toEqual([]);
  });

  it('AMQP # matches zero or more tokens', async () => {
    const ex: IExchangeParams = { ns: 'ns1', name: 'ex_hash_zero_or_more' };
    await topicExchange.bindQueueAsync(queueA, ex, 'user.#');

    // Zero tokens after 'user'
    await expect(topicExchange.matchQueuesAsync(ex, 'user')).resolves.toEqual([
      queueA,
    ]);

    // One token after 'user'
    await expect(
      topicExchange.matchQueuesAsync(ex, 'user.created'),
    ).resolves.toEqual([queueA]);

    // Many tokens after 'user'
    await expect(
      topicExchange.matchQueuesAsync(ex, 'user.profile.updated'),
    ).resolves.toEqual([queueA]);

    // Different domain should not match
    await expect(
      topicExchange.matchQueuesAsync(ex, 'order.created'),
    ).resolves.toEqual([]);
  });

  it('AMQP combined: order.*.created', async () => {
    const ex: IExchangeParams = { ns: 'ns1', name: 'ex_combined_star' };
    await topicExchange.bindQueueAsync(queueA, ex, 'order.*.created');

    // Exactly one token in the middle
    await expect(
      topicExchange.matchQueuesAsync(ex, 'order.vip.created'),
    ).resolves.toEqual([queueA]);

    // No middle token -> no match
    await expect(
      topicExchange.matchQueuesAsync(ex, 'order.created'),
    ).resolves.toEqual([]);

    // More than one middle token -> no match
    await expect(
      topicExchange.matchQueuesAsync(ex, 'order.vip.item.created'),
    ).resolves.toEqual([]);
  });

  it('AMQP # in the middle: order.#.created', async () => {
    const ex: IExchangeParams = { ns: 'ns1', name: 'ex_hash_middle' };
    await topicExchange.bindQueueAsync(queueA, ex, 'order.#.created');

    // # as zero tokens (directly "order.created")
    await expect(
      topicExchange.matchQueuesAsync(ex, 'order.created'),
    ).resolves.toEqual([queueA]);

    // # as one token
    await expect(
      topicExchange.matchQueuesAsync(ex, 'order.vip.created'),
    ).resolves.toEqual([queueA]);

    // # as several tokens
    await expect(
      topicExchange.matchQueuesAsync(ex, 'order.vip.item.created'),
    ).resolves.toEqual([queueA]);

    // Different start token -> no match
    await expect(
      topicExchange.matchQueuesAsync(ex, 'orders.created'),
    ).resolves.toEqual([]);

    // Extra trailing token -> no match
    await expect(
      topicExchange.matchQueuesAsync(ex, 'order.created.extra'),
    ).resolves.toEqual([]);
  });

  it('Multiple patterns with same queue: matched results are de-duplicated', async () => {
    const ex: IExchangeParams = { ns: 'ns1', name: 'ex_dedup' };
    await topicExchange.bindQueueAsync(queueA, ex, 'order.*');
    await topicExchange.bindQueueAsync(queueA, ex, 'order.#');
    await topicExchange.bindQueueAsync(queueB, ex, 'order.created'); // different queue for exact match

    const matched = await topicExchange.matchQueuesAsync(ex, 'order.created');

    // Expect both queueA and queueB, with queueA appearing only once
    const names = matched.map((q) => q.name).sort();
    expect(names).toEqual(['queue1', 'queue2']);
  });

  it('getBindingPatterns and getBindingPatternQueues reflect bindings', async () => {
    const ex: IExchangeParams = { ns: 'ns1', name: 'ex_getters' };
    const p1 = 'user.*';
    const p2 = 'user.#';

    await topicExchange.bindQueueAsync(queueA, ex, p1);
    await topicExchange.bindQueueAsync(queueB, ex, p2);

    const patterns = await topicExchange.getBindingPatternsAsync(ex);
    expect(patterns.sort()).toEqual([p1, p2].sort());

    const p1Queues = await topicExchange.getBindingPatternQueuesAsync(ex, p1);
    const p2Queues = await topicExchange.getBindingPatternQueuesAsync(ex, p2);

    expect(p1Queues).toEqual([queueA]);
    expect(p2Queues).toEqual([queueB]);

    // Ensure matching returns both queues depending on routing key
    const m1 = await topicExchange.matchQueuesAsync(ex, 'user.created');
    // user.created matches both user.* (queueA) and user.# (queueB)
    const m1Names = m1.map((q) => q.name).sort();
    expect(m1Names).toEqual(['queue1', 'queue2']);
  });

  it('Invalid pattern is rejected', async () => {
    const ex: IExchangeParams = { ns: 'ns1', name: 'ex_invalid_pattern' };
    // double dot should be invalid
    await expect(
      topicExchange.bindQueueAsync(queueA, ex, 'order..created'),
    ).rejects.toThrow(InvalidTopicBindingPatternError);
  });

  //
  // Additional validation tests for topic binding patterns
  //
  describe('topic binding pattern validation', () => {
    it('rejects empty or whitespace-only patterns', async () => {
      const ex: IExchangeParams = { ns: 'ns1', name: 'ex_invalid_empty' };
      const invalid = ['', ' ', '   '];

      for (const p of invalid) {
        // eslint-disable-next-line no-await-in-loop
        await expect(
          topicExchange.bindQueueAsync(queueA, ex, p),
        ).rejects.toThrow(InvalidTopicBindingPatternError);
      }
    });

    it('rejects leading, trailing, and consecutive dots', async () => {
      const ex: IExchangeParams = { ns: 'ns1', name: 'ex_invalid_dots' };
      const invalid = ['.order', 'order.', '.order.', 'order..created'];

      for (const p of invalid) {
        // eslint-disable-next-line no-await-in-loop
        await expect(
          topicExchange.bindQueueAsync(queueA, ex, p),
        ).rejects.toThrow(InvalidTopicBindingPatternError);
      }
    });

    it('rejects tokens mixing wildcards with literals or multi-wildcard tokens', async () => {
      const ex: IExchangeParams = { ns: 'ns1', name: 'ex_invalid_tokens' };
      const invalid = [
        'ord*er',
        'ord#er',
        'order.*created',
        'order.#created',
        'crea*ted',
        'crea#ted',
        '**',
        '##',
        'order.**.created',
        'order.##.created',
        'order.*#.created',
      ];

      for (const p of invalid) {
        // eslint-disable-next-line no-await-in-loop
        await expect(
          topicExchange.bindQueueAsync(queueA, ex, p),
        ).rejects.toThrow(InvalidTopicBindingPatternError);
      }
    });

    it('accepts valid patterns and allows binding/matching', async () => {
      const ex: IExchangeParams = { ns: 'ns1', name: 'ex_valid_patterns' };
      const valid = [
        'order',
        '*',
        '#',
        '*.created',
        'order.*',
        'order.#',
        'order.*.created',
        'user.#.profile',
      ];

      for (const p of valid) {
        // eslint-disable-next-line no-await-in-loop
        await expect(
          topicExchange.bindQueueAsync(queueA, ex, p),
        ).resolves.toBeUndefined();
      }

      // Spot-check matching for a couple of the valid patterns
      await expect(topicExchange.matchQueuesAsync(ex, 'foo')).resolves.toEqual([
        queueA,
      ]); // matches '#'
      await expect(
        topicExchange.matchQueuesAsync(ex, 'order.vip.created'),
      ).resolves.toEqual([queueA]); // matches 'order.*.created'
      await expect(
        topicExchange.matchQueuesAsync(ex, 'user.a.b.profile'),
      ).resolves.toEqual([queueA]); // matches 'user.#.profile'
    });

    it('unbindQueue: rejects invalid pattern before performing any operation', async () => {
      const ex: IExchangeParams = { ns: 'ns1', name: 'ex_unbind_invalid' };

      // Valid bind
      await topicExchange.bindQueueAsync(queueA, ex, 'valid.token');

      // Invalid unbind patterns
      const invalid = ['.bad', 'bad.', 'bad..token', 'to#ken', 'to*ken', ''];

      for (const p of invalid) {
        // eslint-disable-next-line no-await-in-loop
        await expect(
          topicExchange.unbindQueueAsync(queueA, ex, p),
        ).rejects.toThrow(InvalidTopicBindingPatternError);
      }

      // Ensure original valid binding still works (no side-effects from failed unbinds)
      await expect(
        topicExchange.matchQueuesAsync(ex, 'valid.token'),
      ).resolves.toEqual([queueA]);
    });
  });

  describe('getBindingPatterns() & getBindingPatternQueues()', () => {
    it('getBindingPatterns: returns empty array when exchange has no bindings', async () => {
      const ex: IExchangeParams = { ns: 'ns1', name: 'ex_patterns_empty' };
      const patterns = await topicExchange.getBindingPatternsAsync(ex);
      expect(patterns).toEqual([]);
    });

    it('getBindingPatterns: unique set even when multiple queues bind the same pattern', async () => {
      const ex: IExchangeParams = { ns: 'ns1', name: 'ex_patterns_unique' };
      const pattern = 'inventory.*';

      await topicExchange.bindQueueAsync(queueA, ex, pattern);
      await topicExchange.bindQueueAsync(queueB, ex, pattern);

      const patterns = await topicExchange.getBindingPatternsAsync(ex);
      expect(patterns).toEqual([pattern]);

      const queues = await topicExchange.getBindingPatternQueuesAsync(
        ex,
        pattern,
      );

      const sortByName = (arr: IQueueParams[]) =>
        [...arr].sort((a, b) => a.name.localeCompare(b.name));
      expect(sortByName(queues)).toEqual(sortByName([queueA, queueB]));
    });

    it('getBindingPatternQueues: updates as queues unbind; pattern removed when last queue unbound', async () => {
      const ex: IExchangeParams = { ns: 'ns1', name: 'ex_pattern_update' };
      const pattern = 'order.*';

      await topicExchange.bindQueueAsync(queueA, ex, pattern);
      await topicExchange.bindQueueAsync(queueB, ex, pattern);

      // Both queues present
      let queues = await topicExchange.getBindingPatternQueuesAsync(
        ex,
        pattern,
      );
      expect(queues.map((q) => q.name).sort()).toEqual(['queue1', 'queue2']);

      // Unbind one queue
      await topicExchange.unbindQueueAsync(queueA, ex, pattern);
      queues = await topicExchange.getBindingPatternQueuesAsync(ex, pattern);
      expect(queues).toEqual([queueB]);

      // Unbind the last queue -> pattern should disappear from exchange
      await topicExchange.unbindQueueAsync(queueB, ex, pattern);
      queues = await topicExchange.getBindingPatternQueuesAsync(ex, pattern);
      expect(queues).toEqual([]);

      const patternsAfter = await topicExchange.getBindingPatternsAsync(ex);
      expect(patternsAfter).toEqual([]);
    });

    it('isolation: binding patterns are per exchange', async () => {
      const ex1: IExchangeParams = { ns: 'ns1', name: 'ex_patterns_iso1' };
      const ex2: IExchangeParams = { ns: 'ns1', name: 'ex_patterns_iso2' };
      const p1 = 'user.*';
      const p2 = 'account.#';

      await topicExchange.bindQueueAsync(queueA, ex1, p1);
      await topicExchange.bindQueueAsync(queueB, ex2, p2);

      const ex1Patterns = await topicExchange.getBindingPatternsAsync(ex1);
      const ex2Patterns = await topicExchange.getBindingPatternsAsync(ex2);

      expect(ex1Patterns).toEqual([p1]);
      expect(ex2Patterns).toEqual([p2]);

      // Queues for p2 should be empty when queried against ex1 and vice versa
      const ex1p2Queues = await topicExchange.getBindingPatternQueuesAsync(
        ex1,
        p2,
      );
      const ex2p1Queues = await topicExchange.getBindingPatternQueuesAsync(
        ex2,
        p1,
      );

      expect(ex1p2Queues).toEqual([]);
      expect(ex2p1Queues).toEqual([]);
    });

    it('getBindingPatternQueues: returns empty array for a valid but unknown pattern on an exchange', async () => {
      const ex: IExchangeParams = { ns: 'ns1', name: 'ex_unknown_pattern' };
      const queues = await topicExchange.getBindingPatternQueuesAsync(
        ex,
        'unknown.pattern',
      );
      expect(queues).toEqual([]);
    });
  });
});
