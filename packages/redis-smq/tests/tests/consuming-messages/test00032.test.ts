/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import { ICallback } from 'redis-smq-common';
import { _getConsumerQueues } from '../../../src/consumer/_/_get-consumer-queues.js';
import {
  Consumer,
  EQueueDeliveryModel,
  EQueueType,
  IMessageTransferable,
} from '../../../src/index.js';
import { _getQueueConsumers } from '../../../src/queue/_/_get-queue-consumers.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getDefaultQueue } from '../../common/message-producing-consuming.js';
import { getQueue } from '../../common/queue.js';
import { getRedisInstance } from '../../common/redis.js';

const _getConsumerQueuesAsync = bluebird.promisify(_getConsumerQueues);
const _getQueueConsumersAsync = bluebird.promisify(_getQueueConsumers);

test('Consume message from different queues using a single consumer instance: case 3', async () => {
  const defaultQueue = getDefaultQueue();
  const queue = await getQueue();
  await queue.saveAsync(
    defaultQueue,
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const consumer = bluebird.promisifyAll(new Consumer());
  await consumer.runAsync();

  const redisClient = await getRedisInstance();

  const a = await _getConsumerQueuesAsync(redisClient, consumer.getId());
  expect(a).toEqual([]);

  const a1 = await _getQueueConsumersAsync(redisClient, defaultQueue);
  expect(Object.keys(a1)).toEqual([]);

  await consumer.consumeAsync(
    defaultQueue,
    (msg: IMessageTransferable, cb: ICallback<void>) => cb(),
  );

  const b = await _getConsumerQueuesAsync(redisClient, consumer.getId());
  expect(b).toEqual([defaultQueue]);

  const b1 = await _getQueueConsumersAsync(redisClient, defaultQueue);
  expect(Object.keys(b1)).toEqual([consumer.getId()]);

  await consumer.cancelAsync(defaultQueue);

  const c = await _getConsumerQueuesAsync(redisClient, consumer.getId());
  expect(c).toEqual([]);

  const c1 = await _getQueueConsumersAsync(redisClient, defaultQueue);
  expect(Object.keys(c1)).toEqual([]);

  await shutDownBaseInstance(consumer);
});
