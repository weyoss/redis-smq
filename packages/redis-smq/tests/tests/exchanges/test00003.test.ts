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
  ExchangeHasBoundQueuesError,
  ExchangeNotFoundError,
  NamespaceMismatchError,
  QueueNotBoundError,
} from '../../../src/errors/index.js';
import {
  EQueueType,
  ExchangeFanout,
  IExchangeParams,
  IQueueParams,
  RedisSMQ,
} from '../../../src/index.js';
import { createQueue } from '../../common/message-producing-consuming.js';

describe('ExchangeFanout', () => {
  const exchangeA: IExchangeParams = { ns: 'ns1', name: 'exchange1' };
  const exchangeDifferentNs: IExchangeParams = { ns: 'ns2', name: 'exchange2' };

  const queueA: IQueueParams = { ns: 'ns1', name: 'queue1' };
  const queueB: IQueueParams = { ns: 'ns1', name: 'queue2' };

  let fanoutExchange: ReturnType<typeof bluebird.promisifyAll<ExchangeFanout>>;

  beforeEach(async () => {
    // Create queues up-front
    await createQueue(queueA, EQueueType.FIFO_QUEUE);
    await createQueue(queueB, EQueueType.FIFO_QUEUE);
    fanoutExchange = bluebird.promisifyAll(RedisSMQ.createFanoutExchange());
  });

  it('bindQueue: fails when exchange and queue are of different namespaces', async () => {
    await expect(
      fanoutExchange.bindQueueAsync(queueA, exchangeDifferentNs),
    ).rejects.toThrow(NamespaceMismatchError);
  });

  it('matchQueues: returns empty array when no queues are bound', async () => {
    const matched = await fanoutExchange.matchQueuesAsync(exchangeA);
    expect(matched).toEqual([]);
  });

  it('bindQueue: binds queue and matchQueues returns it', async () => {
    await fanoutExchange.bindQueueAsync(queueA, exchangeA);

    const matched = await fanoutExchange.matchQueuesAsync(exchangeA);
    expect(matched).toEqual([queueA]);
  });

  it('bindQueue: idempotent when binding the same queue again', async () => {
    await fanoutExchange.bindQueueAsync(queueA, exchangeA);
    // Re-bind the same mapping; should not error or duplicate
    await fanoutExchange.bindQueueAsync(queueA, exchangeA);

    const matched = await fanoutExchange.matchQueuesAsync(exchangeA);
    expect(matched).toEqual([queueA]);
  });

  it('bindQueue: fails when binding a non-existent queue', async () => {
    const nonExistingQueue = 'queue-does-not-exist';
    await expect(
      fanoutExchange.bindQueueAsync(nonExistingQueue, exchangeA),
    ).rejects.toBeTruthy();
  });

  it('unbindQueue: removes binding so matchQueues returns empty', async () => {
    await fanoutExchange.bindQueueAsync(queueA, exchangeA);

    const before = await fanoutExchange.matchQueuesAsync(exchangeA);
    expect(before).toEqual([queueA]);

    await fanoutExchange.unbindQueueAsync(queueA, exchangeA);

    const after = await fanoutExchange.matchQueuesAsync(exchangeA);
    expect(after).toEqual([]);
  });

  it('unbindQueue: rejects when exchange is not found or queue is not bound', async () => {
    // Ensure nothing is bound
    const matched = await fanoutExchange.matchQueuesAsync(exchangeA);
    expect(matched).toEqual([]);

    await expect(
      fanoutExchange.unbindQueueAsync(queueA, exchangeA),
    ).rejects.toThrow(ExchangeNotFoundError);

    await fanoutExchange.bindQueueAsync(queueB, exchangeA);

    await expect(
      fanoutExchange.unbindQueueAsync(queueA, exchangeA),
    ).rejects.toThrow(QueueNotBoundError);
  });

  it('deleteExchange: prevents deletion when queues are bound, then deletes when unbound', async () => {
    await fanoutExchange.bindQueueAsync(queueB, exchangeA);

    // Try deleting while bound -> expect specific failure
    await expect(fanoutExchange.deleteAsync(exchangeA)).rejects.toThrow(
      ExchangeHasBoundQueuesError,
    );

    // Unbind and then delete
    await fanoutExchange.unbindQueueAsync(queueB, exchangeA);
    await fanoutExchange.deleteAsync(exchangeA);
  });

  it('broadcast semantics: multiple bound queues are all matched', async () => {
    await fanoutExchange.bindQueueAsync(queueA, exchangeA);
    await fanoutExchange.bindQueueAsync(queueB, exchangeA);

    const matched = await fanoutExchange.matchQueuesAsync(exchangeA);

    const names = matched.map((q) => q.name).sort();
    expect(names).toEqual(['queue1', 'queue2']);
  });

  it('re-binding multiple times does not duplicate results', async () => {
    await fanoutExchange.bindQueueAsync(queueA, exchangeA);
    await fanoutExchange.bindQueueAsync(queueA, exchangeA);
    await fanoutExchange.bindQueueAsync(queueA, exchangeA);

    const matched = await fanoutExchange.matchQueuesAsync(exchangeA);
    expect(matched).toEqual([queueA]);
  });

  it('binding and unbinding different queues behaves independently', async () => {
    await fanoutExchange.bindQueueAsync(queueA, exchangeA);
    await fanoutExchange.bindQueueAsync(queueB, exchangeA);

    // Unbind only queueA
    await fanoutExchange.unbindQueueAsync(queueA, exchangeA);

    const matched = await fanoutExchange.matchQueuesAsync(exchangeA);
    expect(matched).toEqual([queueB]);

    // Now unbind queueB as well
    await fanoutExchange.unbindQueueAsync(queueB, exchangeA);

    const none = await fanoutExchange.matchQueuesAsync(exchangeA);
    expect(none).toEqual([]);
  });
});
