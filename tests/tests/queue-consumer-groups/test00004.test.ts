/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import bluebird from 'bluebird';
import {
  Consumer,
  ConsumerGroups,
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
  IMessageTransferable,
  IQueueParams,
  Producer,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import { getQueue } from '../../common/queue.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';
import { getQueueMessages } from '../../common/queue-messages.js';

test('Publish and consume a message to/from queue with many consumer groups: using many consumers', async () => {
  const queue1: IQueueParams = {
    name: 'test-queue',
    ns: 'ns1',
  };

  const queue = await getQueue();
  await queue.saveAsync(
    queue1,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.PUB_SUB,
  );

  const consumerGroups = bluebird.promisifyAll(new ConsumerGroups());
  await consumerGroups.saveConsumerGroupAsync(queue1, 'my-group-1');
  await consumerGroups.saveConsumerGroupAsync(queue1, 'my-group-2');
  await consumerGroups.saveConsumerGroupAsync(queue1, 'my-group-3');

  const consumer1 = bluebird.promisifyAll(new Consumer());
  await consumer1.consumeAsync(
    { queue: queue1, groupId: 'my-group-1' },
    (msg, cb) => cb(),
  );
  await consumer1.runAsync();

  const consumer2 = bluebird.promisifyAll(new Consumer());
  await consumer2.consumeAsync(
    { queue: queue1, groupId: 'my-group-2' },
    (msg, cb) => cb(),
  );
  await consumer2.runAsync();

  const consumer3 = bluebird.promisifyAll(new Consumer());
  await consumer3.consumeAsync(
    { queue: queue1, groupId: 'my-group-3' },
    (msg, cb) => cb(),
  );
  await consumer3.runAsync();

  const consumer4 = bluebird.promisifyAll(new Consumer());
  await consumer4.consumeAsync(
    { queue: queue1, groupId: 'my-group-4' },
    (msg, cb) => cb(),
  );
  await consumer4.runAsync();

  await bluebird.delay(5000);

  const allGroups = await consumerGroups.getConsumerGroupsAsync(queue1);
  expect(allGroups.sort()).toEqual([
    'my-group-1',
    'my-group-2',
    'my-group-3',
    'my-group-4',
  ]);

  const producer = bluebird.promisifyAll(new Producer());
  await producer.runAsync();

  const ids = await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setPriority(EMessagePriority.HIGHEST),
  );
  expect(ids.length).toEqual(4);

  const [id1, id2, id3, id4] = ids;
  expect(id1).toBeDefined();
  expect(id2).toBeDefined();
  expect(id3).toBeDefined();
  expect(id4).toBeDefined();

  await bluebird.delay(5000);

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(queue1);
  expect(count).toEqual({
    acknowledged: 4,
    deadLettered: 0,
    pending: {
      'my-group-1': 0,
      'my-group-2': 0,
      'my-group-3': 0,
      'my-group-4': 0,
    },
    scheduled: 0,
  });

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const res3 = await acknowledgedMessages.getMessagesAsync(queue1, 0, 100);
  expect(res3.totalItems).toBe(4);
  expect(res3.items.length).toBe(4);
  expect(
    res3.items.map((i: IMessageTransferable) => i.consumerGroupId).sort(),
  ).toEqual(['my-group-1', 'my-group-2', 'my-group-3', 'my-group-4']);

  await consumer1.shutdownAsync();
  await consumer2.shutdownAsync();
  await consumer3.shutdownAsync();
  await consumer4.shutdownAsync();
  await producer.shutdownAsync();
  await consumerGroups.shutdownAsync();
});
