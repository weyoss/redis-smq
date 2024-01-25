/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { QueueConsumerGroupsDictionary } from '../../../src/lib/producer/queue-consumer-groups-dictionary';
import { getRedisInstance } from '../../common/redis';
import { delay, promisifyAll } from 'bluebird';
import { Queue } from '../../../src/lib/queue/queue/queue';
import { EQueueDeliveryModel, EQueueType, IQueueParams } from '../../../types';
import { Consumer } from '../../../src/lib/consumer/consumer';
import { ConsumerGroups } from '../../../src/lib/consumer/consumer-groups/consumer-groups';

test('QueueConsumerGroupsDictionary: combined tests', async () => {
  const redisClient = await getRedisInstance();
  const dictionary = promisifyAll(
    new QueueConsumerGroupsDictionary(redisClient),
  );
  await dictionary.runAsync();

  const queue1: IQueueParams = {
    name: 'test-queue',
    ns: 'ns1',
  };

  const gp1 = dictionary.getConsumerGroups(queue1);
  expect(gp1).toEqual({
    exists: false,
    consumerGroups: [],
  });

  const queue = promisifyAll(new Queue());
  await queue.saveAsync(
    queue1,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.PUB_SUB,
  );

  await delay(5000);

  const gp2 = dictionary.getConsumerGroups(queue1);
  expect(gp2).toEqual({
    exists: true,
    consumerGroups: [],
  });

  const consumer = promisifyAll(new Consumer());
  await consumer.runAsync();

  await consumer.consumeAsync(
    { queue: queue1, groupId: 'my-group' },
    (msg, cb) => cb(),
  );

  await delay(5000);

  const gp3 = dictionary.getConsumerGroups(queue1);
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

  await delay(5000);

  const gp4 = dictionary.getConsumerGroups(queue1);
  expect(gp4).toEqual({
    exists: true,
    consumerGroups: ['my-group'],
  });
  const gp5 = dictionary.getConsumerGroups(queue2);
  expect(gp5).toEqual({
    exists: true,
    consumerGroups: [],
  });

  const gp6 = dictionary.getConsumerGroups(queue3);
  expect(gp6).toEqual({
    exists: false,
    consumerGroups: [],
  });

  await consumer.shutdownAsync();

  const consumerGroups = promisifyAll(new ConsumerGroups());
  await consumerGroups.deleteConsumerGroupAsync(queue1, 'my-group');

  await delay(5000);

  const gp7 = dictionary.getConsumerGroups(queue1);
  expect(gp7).toEqual({
    exists: true,
    consumerGroups: [],
  });
  const gp8 = dictionary.getConsumerGroups(queue2);
  expect(gp8).toEqual({
    exists: true,
    consumerGroups: [],
  });

  await queue.deleteAsync(queue1);

  await delay(5000);

  const gp9 = dictionary.getConsumerGroups(queue1);
  expect(gp9).toEqual({
    exists: false,
    consumerGroups: [],
  });
  const gp10 = dictionary.getConsumerGroups(queue2);
  expect(gp10).toEqual({
    exists: true,
    consumerGroups: [],
  });

  await dictionary.quitAsync();

  const dictionary2 = promisifyAll(
    new QueueConsumerGroupsDictionary(redisClient),
  );
  await dictionary2.runAsync();
  const gp11 = dictionary2.getConsumerGroups(queue2);
  expect(gp11).toEqual({
    exists: true,
    consumerGroups: [],
  });

  await dictionary2.quitAsync();
});
