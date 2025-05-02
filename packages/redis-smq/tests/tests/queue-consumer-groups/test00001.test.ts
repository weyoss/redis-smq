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
import { RedisClient } from '../../../src/common/redis-client/redis-client.js';
import {
  Consumer,
  ConsumerGroups,
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
} from '../../../index.js';
import { QueueConsumerGroupsCache } from '../../../src/lib/producer/queue-consumer-groups-cache.js';
import { getProducer } from '../../common/producer.js';
import { getQueue } from '../../common/queue.js';
import { EventBus } from '../../../index.js';

test('QueueConsumerGroupsCache: combined tests', async () => {
  const producer = getProducer();

  const eventBus = bluebird.promisifyAll(new EventBus());
  await eventBus.initAsync();

  const redisClient = bluebird.promisifyAll(new RedisClient());
  await redisClient.initAsync();

  // initializing a standalone dictionary
  const queueConsumerGroupsDictionary = bluebird.promisifyAll(
    new QueueConsumerGroupsCache(producer, redisClient, eventBus),
  );
  await queueConsumerGroupsDictionary.runAsync();

  const queue1: IQueueParams = {
    name: 'test-queue',
    ns: 'ns1',
  };

  const gp1 = queueConsumerGroupsDictionary.getConsumerGroups(queue1);
  expect(gp1).toEqual({
    exists: false,
    consumerGroups: [],
  });

  const queue = await getQueue();
  await queue.saveAsync(
    queue1,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.PUB_SUB,
  );

  await bluebird.delay(5000);

  const gp2 = queueConsumerGroupsDictionary.getConsumerGroups(queue1);
  expect(gp2).toEqual({
    exists: true,
    consumerGroups: [],
  });

  const consumer = bluebird.promisifyAll(new Consumer());
  await consumer.runAsync();

  await consumer.consumeAsync(
    { queue: queue1, groupId: 'my-group' },
    (msg, cb) => cb(),
  );

  await bluebird.delay(5000);

  const gp3 = queueConsumerGroupsDictionary.getConsumerGroups(queue1);
  expect(gp3).toEqual({
    exists: true,
    consumerGroups: ['my-group'],
  });

  const queue2: IQueueParams = {
    name: 'test-queue2',
    ns: 'ns2',
  };
  await queue.saveAsync(
    queue2,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.PUB_SUB,
  );

  const queue3: IQueueParams = {
    name: 'test-queue3',
    ns: 'ns3',
  };
  await queue.saveAsync(
    queue3,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  await bluebird.delay(5000);

  const gp4 = queueConsumerGroupsDictionary.getConsumerGroups(queue1);
  expect(gp4).toEqual({
    exists: true,
    consumerGroups: ['my-group'],
  });
  const gp5 = queueConsumerGroupsDictionary.getConsumerGroups(queue2);
  expect(gp5).toEqual({
    exists: true,
    consumerGroups: [],
  });

  const gp6 = queueConsumerGroupsDictionary.getConsumerGroups(queue3);
  expect(gp6).toEqual({
    exists: false,
    consumerGroups: [],
  });

  await consumer.shutdownAsync();

  const consumerGroups = bluebird.promisifyAll(new ConsumerGroups());
  await consumerGroups.deleteConsumerGroupAsync(queue1, 'my-group');

  await bluebird.delay(5000);

  const gp7 = queueConsumerGroupsDictionary.getConsumerGroups(queue1);
  expect(gp7).toEqual({
    exists: true,
    consumerGroups: [],
  });
  const gp8 = queueConsumerGroupsDictionary.getConsumerGroups(queue2);
  expect(gp8).toEqual({
    exists: true,
    consumerGroups: [],
  });

  await queue.deleteAsync(queue1);

  await bluebird.delay(5000);

  const gp9 = queueConsumerGroupsDictionary.getConsumerGroups(queue1);
  expect(gp9).toEqual({
    exists: false,
    consumerGroups: [],
  });
  const gp10 = queueConsumerGroupsDictionary.getConsumerGroups(queue2);
  expect(gp10).toEqual({
    exists: true,
    consumerGroups: [],
  });

  await queueConsumerGroupsDictionary.shutdownAsync();

  const queueConsumerGroupsDictionary2 = bluebird.promisifyAll(
    new QueueConsumerGroupsCache(producer, redisClient, eventBus),
  );
  await queueConsumerGroupsDictionary2.runAsync();
  const gp11 = queueConsumerGroupsDictionary2.getConsumerGroups(queue2);
  expect(gp11).toEqual({
    exists: true,
    consumerGroups: [],
  });

  await queueConsumerGroupsDictionary2.shutdownAsync();
  await consumerGroups.shutdownAsync();
  await eventBus.shutdownAsync();
  await redisClient.shutdownAsync();
});
