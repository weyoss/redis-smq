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
import {
  Consumer,
  ConsumerGroups,
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
  Producer,
  ProducibleMessage,
  ConsumerGroupIdRequiredError,
} from '../../../src/index.js';
import { getMessageManager } from '../../common/message-manager.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { getQueueManager } from '../../common/queue-manager.js';

test('Publish and consume a message to/from a consumer group', async () => {
  const queue1: IQueueParams = {
    name: 'test-queue',
    ns: 'ns1',
  };

  const queue = await getQueueManager();
  await queue.saveAsync(
    queue1,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.PUB_SUB,
  );

  const consumerGroups = bluebird.promisifyAll(new ConsumerGroups());
  await consumerGroups.saveConsumerGroupAsync(queue1, 'my-group');

  const producer = bluebird.promisifyAll(new Producer());
  await producer.runAsync();

  const [messageId] = await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setPriority(EMessagePriority.HIGHEST),
  );

  await bluebird.delay(5000);

  const message = await getMessageManager();
  const msg = await message.getMessageByIdAsync(messageId);
  expect(msg.id).toEqual(messageId);
  expect(msg.consumerGroupId).toEqual('my-group');

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(queue1);
  expect(count).toEqual({
    acknowledged: 0,
    deadLettered: 0,
    pending: { 'my-group': 1 },
    scheduled: 0,
  });

  const pendingMessages = await getQueuePendingMessages();
  await expect(pendingMessages.getMessagesAsync(queue1, 1, 10)).rejects.toThrow(
    ConsumerGroupIdRequiredError,
  );

  const messages = await pendingMessages.getMessagesAsync(
    { queue: queue1, groupId: 'my-group' },
    1,
    10,
  );
  expect(messages.items[0].id).toEqual(messageId);
  expect(messages.items[0].consumerGroupId).toEqual('my-group');

  const consumer = bluebird.promisifyAll(new Consumer());
  await consumer.consumeAsync(
    { queue: queue1, groupId: 'my-group' },
    (msg, cb) => cb(),
  );
  await consumer.runAsync();
  await bluebird.delay(5000);

  const count2 = await queueMessages.countMessagesByStatusAsync(queue1);
  expect(count2).toEqual({
    acknowledged: 1,
    deadLettered: 0,
    pending: { 'my-group': 0 },
    scheduled: 0,
  });

  await consumer.shutdownAsync();
  await producer.shutdownAsync();
  await consumerGroups.shutdownAsync();
});
