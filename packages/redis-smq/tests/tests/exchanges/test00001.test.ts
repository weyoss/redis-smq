/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  InvalidDirectExchangeParametersError,
  NamespaceMismatchError,
} from '../../../src/errors/index.js';
import {
  EQueueType,
  ExchangeDirect,
  IExchangeParams,
  IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue } from '../../common/message-producing-consuming.js';

describe('ExchangeDirect', () => {
  const exchangeA: IExchangeParams = { ns: 'ns1', name: 'exchange1' };
  const queueA: IQueueParams = { ns: 'ns1', name: 'queue1' };
  const queueB: IQueueParams = { ns: 'ns1', name: 'queue2' };
  const rkA = 'order.created';
  const rkB = 'order.cancelled';
  const rkUnknown = 'order.updated';

  let directExchange: ReturnType<typeof bluebird.promisifyAll<ExchangeDirect>>;

  beforeEach(async () => {
    // Create queues up-front
    await createQueue(queueA, EQueueType.FIFO_QUEUE);
    await createQueue(queueB, EQueueType.FIFO_QUEUE);
    directExchange = bluebird.promisifyAll(RedisSMQ.createDirectExchange());
  });

  it('bindQueue: fails when exchange and queue are of different namespaces', async () => {
    await expect(
      directExchange.bindQueueAsync(queueA, 'exchange2', rkA),
    ).rejects.toThrow(NamespaceMismatchError);
  });

  it('bindQueue: binds queue with exact routing key and matchQueues returns it', async () => {
    // Bind queueA with rkA
    await directExchange.bindQueueAsync(queueA, exchangeA, rkA);

    // matchQueues should return queueA for rkA
    const matchedForA = await directExchange.matchQueuesAsync(exchangeA, rkA);
    expect(matchedForA).toEqual([queueA]);

    // For another key (rkB) it should not return queueA
    const matchedForB = await directExchange.matchQueuesAsync(exchangeA, rkB);
    expect(matchedForB).toEqual([]);
  });

  it('bindQueue: idempotent when binding the same queue/key again', async () => {
    await directExchange.bindQueueAsync(queueA, exchangeA, rkA);
    // Re-bind the same mapping; should not error
    await directExchange.bindQueueAsync(queueA, exchangeA, rkA);

    // Still matches
    const matched = await directExchange.matchQueuesAsync(exchangeA, rkA);
    expect(matched).toEqual([queueA]);
  });

  it('bindQueue: fails when binding a non-existent queue', async () => {
    const nonExistingQueue = `queue-does-not-exist`;
    await expect(
      directExchange.bindQueueAsync(nonExistingQueue, exchangeA, rkA),
    ).rejects.toBeTruthy();
  });

  it('matchQueues: returns empty array when no bindings match', async () => {
    await directExchange.bindQueueAsync(queueA, exchangeA, rkA);
    const matched = await directExchange.matchQueuesAsync(exchangeA, rkUnknown);
    expect(matched).toEqual([]);
  });

  it('unbindQueue: removes binding so matchQueues returns empty for that key', async () => {
    // Ensure queueA is bound to rkA
    await directExchange.bindQueueAsync(queueA, exchangeA, rkA);
    const matchedBefore = await directExchange.matchQueuesAsync(exchangeA, rkA);

    expect(matchedBefore).toEqual([queueA]);

    // Unbind and verify
    await directExchange.unbindQueueAsync(queueA, exchangeA, rkA);
    const matchedAfter = await directExchange.matchQueuesAsync(exchangeA, rkA);
    expect(matchedAfter).toEqual([]);
  });

  it('deleteExchange: prevents deletion when queues are bound, then deletes when unbound', async () => {
    // Bind queueB with rkB
    await directExchange.bindQueueAsync(queueB, exchangeA, rkB);

    // Try deleting while bound -> expect failure if deleteExchange is supported
    const tryDeleteWhileBound = directExchange.deleteAsync(exchangeA);
    await expect(tryDeleteWhileBound).rejects.toBeTruthy();

    // Unbind and then delete
    await directExchange.unbindQueueAsync(queueB, exchangeA, rkB);

    await directExchange.deleteAsync(exchangeA);
  });

  it('bindQueue: rejects invalid routing keys', async () => {
    const invalidKeys = [
      '', // empty
      ' ', // whitespace
      'order created', // spaces
      'order/created', // slash
      'order:created', // colon
      'order\\created', // backslash
      'order*created', // star
      'order#created', // hash
      'order[created]', // brackets
      'ключ', // non-ASCII
      '\n', // newline
    ];
    for (const k of invalidKeys) {
      await expect(
        directExchange.bindQueueAsync(queueA, exchangeA, k),
      ).rejects.toThrow(InvalidDirectExchangeParametersError);
    }
  });

  it('matchQueues: rejects invalid routing keys', async () => {
    const invalidKeys = [
      '',
      ' ',
      'bad*key',
      'bad#key',
      'foo/bar',
      'foo\\bar',
      'föö', // unicode
    ];
    for (const k of invalidKeys) {
      await expect(
        directExchange.matchQueuesAsync(exchangeA, k),
      ).rejects.toThrow(InvalidDirectExchangeParametersError);
    }
  });

  it('unbindQueue: rejects invalid routing keys', async () => {
    // Prepare a valid binding to ensure unbind path is exercised
    await directExchange.bindQueueAsync(queueA, exchangeA, rkA);

    const invalidKeys = [
      ' ',
      '',
      '0',
      '1234',
      'bad*key',
      'bad#key',
      'a/b',
      '\t',
    ];
    for (const k of invalidKeys) {
      await expect(
        directExchange.unbindQueueAsync(queueA, exchangeA, k),
      ).rejects.toThrow(InvalidDirectExchangeParametersError);
    }

    // Ensure valid unbind still works
    await expect(
      directExchange.unbindQueueAsync(queueA, exchangeA, rkA),
    ).resolves.toBeUndefined();
  });

  it('accepts valid routing keys (alphanumeric, hyphens, underscores, dots)', async () => {
    const validKeys = [
      'a',
      'A',
      'a-b',
      'a_b',
      'a.b',
      'A-1_2.3',
      'order.created',
      'payment_v2-updated',
      'USER_123.ACTION-456',
    ];

    for (const k of validKeys) {
      await expect(
        directExchange.bindQueueAsync(queueA, exchangeA, k),
      ).resolves.toBeUndefined();

      const matched = await directExchange.matchQueuesAsync(exchangeA, k);
      expect(matched).toEqual([queueA]);

      // Clean up for the next key
      await directExchange.unbindQueueAsync(queueA, exchangeA, k);
    }
  });

  it('binding with different valid keys does not leak between keys', async () => {
    const k1 = 'alpha.key';
    const k2 = 'beta_key';
    await directExchange.bindQueueAsync(queueA, exchangeA, k1);
    await directExchange.bindQueueAsync(queueB, exchangeA, k2);

    const m1 = await directExchange.matchQueuesAsync(exchangeA, k1);
    const m2 = await directExchange.matchQueuesAsync(exchangeA, k2);

    expect(m1).toEqual([queueA]);
    expect(m2).toEqual([queueB]);

    await directExchange.unbindQueueAsync(queueA, exchangeA, k1);
    await directExchange.unbindQueueAsync(queueB, exchangeA, k2);
  });

  it('getRoutingKeys: returns all routing keys bound to the exchange (unique set)', async () => {
    await directExchange.bindQueueAsync(queueA, exchangeA, rkA);
    await directExchange.bindQueueAsync(queueB, exchangeA, rkB);

    const keys = await directExchange.getRoutingKeysAsync(exchangeA);
    expect(keys.sort()).toEqual([rkA, rkB].sort());
  });

  it('getRoutingKeys: reflects removal only after the last queue unbinds from a key', async () => {
    // Bind two queues to the same key
    await directExchange.bindQueueAsync(queueA, exchangeA, rkA);
    await directExchange.bindQueueAsync(queueB, exchangeA, rkA);

    // Keys should contain rkA
    let keys = await directExchange.getRoutingKeysAsync(exchangeA);
    expect(keys).toEqual([rkA]);

    // Unbind one queue -> rkA should still be present
    await directExchange.unbindQueueAsync(queueA, exchangeA, rkA);
    keys = await directExchange.getRoutingKeysAsync(exchangeA);
    expect(keys).toEqual([rkA]);

    // Unbind the last queue -> rkA should be removed
    await directExchange.unbindQueueAsync(queueB, exchangeA, rkA);
    keys = await directExchange.getRoutingKeysAsync(exchangeA);
    expect(keys).toEqual([]);
  });

  it('getRoutingKeyQueues: returns all queues bound to a given routing key', async () => {
    // Bind both queues to the same routing key
    await directExchange.bindQueueAsync(queueA, exchangeA, rkA);
    await directExchange.bindQueueAsync(queueB, exchangeA, rkA);

    const queues = await directExchange.getRoutingKeyQueuesAsync(
      exchangeA,
      rkA,
    );

    // Compare ignoring order
    const sortByName = (arr: IQueueParams[]) =>
      [...arr].sort((a, b) => a.name.localeCompare(b.name));

    expect(sortByName(queues)).toEqual(sortByName([queueA, queueB]));
  });

  it('getRoutingKeyQueues: returns empty array for a routing key with no bound queues', async () => {
    await directExchange.bindQueueAsync(queueA, exchangeA, rkA);
    const queues = await directExchange.getRoutingKeyQueuesAsync(
      exchangeA,
      rkUnknown,
    );
    expect(queues).toEqual([]);
  });

  it('getRoutingKeyQueues: rejects invalid routing keys', async () => {
    const invalidKeys = [
      '',
      ' ',
      'bad*key',
      'bad#key',
      'foo/bar',
      'foo\\bar',
      'föö', // unicode
      '\n',
    ];
    for (const k of invalidKeys) {
      await expect(
        directExchange.getRoutingKeyQueuesAsync(exchangeA, k),
      ).rejects.toThrow(InvalidDirectExchangeParametersError);
    }
  });
});
