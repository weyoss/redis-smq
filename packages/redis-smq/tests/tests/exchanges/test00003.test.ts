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

  let fanoutExchange: ExchangeFanout;

  beforeEach(async () => {
    // Create queues up-front
    await createQueue(queueA, EQueueType.FIFO_QUEUE);
    await createQueue(queueB, EQueueType.FIFO_QUEUE);
    fanoutExchange = bluebird.promisifyAll(RedisSMQ.createFanoutExchange());
  });

  it('bindQueue: fails when exchange and queue are of different namespaces', async () => {
    await expect(
      fanoutExchange.bindQueue(queueA, exchangeDifferentNs),
    ).rejects.toThrow(NamespaceMismatchError);
  });

  it('matchQueues: returns empty array when no queues are bound', async () => {
    const matched = await fanoutExchange.matchQueues(exchangeA);
    expect(matched).toEqual([]);
  });

  it('bindQueue: binds queue and matchQueues returns it', async () => {
    await fanoutExchange.bindQueue(queueA, exchangeA);

    const matched = await fanoutExchange.matchQueues(exchangeA);
    expect(matched).toEqual([queueA]);
  });

  it('bindQueue: idempotent when binding the same queue again', async () => {
    await fanoutExchange.bindQueue(queueA, exchangeA);
    // Re-bind the same mapping; should not error or duplicate
    await fanoutExchange.bindQueue(queueA, exchangeA);

    const matched = await fanoutExchange.matchQueues(exchangeA);
    expect(matched).toEqual([queueA]);
  });

  it('bindQueue: fails when binding a non-existent queue', async () => {
    const nonExistingQueue = 'queue-does-not-exist';
    await expect(
      fanoutExchange.bindQueue(nonExistingQueue, exchangeA),
    ).rejects.toBeTruthy();
  });

  it('unbindQueue: removes binding so matchQueues returns empty', async () => {
    await fanoutExchange.bindQueue(queueA, exchangeA);

    const before = await fanoutExchange.matchQueues(exchangeA);
    expect(before).toEqual([queueA]);

    await fanoutExchange.unbindQueue(queueA, exchangeA);

    const after = await fanoutExchange.matchQueues(exchangeA);
    expect(after).toEqual([]);
  });

  it('unbindQueue: rejects when exchange is not found or queue is not bound', async () => {
    // Ensure nothing is bound
    const matched = await fanoutExchange.matchQueues(exchangeA);
    expect(matched).toEqual([]);

    await expect(fanoutExchange.unbindQueue(queueA, exchangeA)).rejects.toThrow(
      ExchangeNotFoundError,
    );

    await fanoutExchange.bindQueue(queueB, exchangeA);

    await expect(fanoutExchange.unbindQueue(queueA, exchangeA)).rejects.toThrow(
      QueueNotBoundError,
    );
  });

  it('deleteExchange: prevents deletion when queues are bound, then deletes when unbound', async () => {
    await fanoutExchange.bindQueue(queueB, exchangeA);

    // Try deleting while bound -> expect specific failure
    await expect(fanoutExchange.delete(exchangeA)).rejects.toThrow(
      ExchangeHasBoundQueuesError,
    );

    // Unbind and then delete
    await fanoutExchange.unbindQueue(queueB, exchangeA);
    await fanoutExchange.delete(exchangeA);
  });

  it('broadcast semantics: multiple bound queues are all matched', async () => {
    await fanoutExchange.bindQueue(queueA, exchangeA);
    await fanoutExchange.bindQueue(queueB, exchangeA);

    const matched = await fanoutExchange.matchQueues(exchangeA);

    const names = matched.map((q) => q.name).sort();
    expect(names).toEqual(['queue1', 'queue2']);
  });

  it('re-binding multiple times does not duplicate results', async () => {
    await fanoutExchange.bindQueue(queueA, exchangeA);
    await fanoutExchange.bindQueue(queueA, exchangeA);
    await fanoutExchange.bindQueue(queueA, exchangeA);

    const matched = await fanoutExchange.matchQueues(exchangeA);
    expect(matched).toEqual([queueA]);
  });

  it('binding and unbinding different queues behaves independently', async () => {
    await fanoutExchange.bindQueue(queueA, exchangeA);
    await fanoutExchange.bindQueue(queueB, exchangeA);

    // Unbind only queueA
    await fanoutExchange.unbindQueue(queueA, exchangeA);

    const matched = await fanoutExchange.matchQueues(exchangeA);
    expect(matched).toEqual([queueB]);

    // Now unbind queueB as well
    await fanoutExchange.unbindQueue(queueB, exchangeA);

    const none = await fanoutExchange.matchQueues(exchangeA);
    expect(none).toEqual([]);
  });
});
