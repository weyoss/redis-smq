/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { delay, promisifyAll } from 'bluebird';
import { Queue } from '../../../src/lib/queue/queue/queue';
import {
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
} from '../../../types';
import { Consumer } from '../../../src/lib/consumer/consumer';
import { Producer } from '../../../src/lib/producer/producer';
import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { Message } from '../../../src/lib/message/message';
import { QueueMessages } from '../../../src/lib/queue/queue-messages/queue-messages';
import { ConsumerGroups } from '../../../src/lib/consumer/consumer-groups/consumer-groups';
import { QueuePendingMessages } from '../../../src/lib/queue/queue-pending-messages/queue-pending-messages';
import { ConsumerGroupIdRequiredError } from '../../../src/lib/consumer/errors';

test('Publish and consume a message to/from a consumer group', async () => {
  const queue1: IQueueParams = {
    name: 'test-queue',
    ns: 'ns1',
  };

  const queue = promisifyAll(new Queue());
  await queue.saveAsync(
    queue1,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.PUB_SUB,
  );

  const consumerGroups = promisifyAll(new ConsumerGroups());
  await consumerGroups.saveConsumerGroupAsync(queue1, 'my-group');

  const producer = promisifyAll(new Producer());
  await producer.runAsync();

  const [messageId] = await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setPriority(EMessagePriority.HIGHEST),
  );

  await delay(5000);

  const message = promisifyAll(new Message());
  const msg = await message.getMessageByIdAsync(messageId);
  expect(msg.id).toEqual(messageId);
  expect(msg.consumerGroupId).toEqual('my-group');

  const queueMessages = promisifyAll(new QueueMessages());
  const count = await queueMessages.countMessagesByStatusAsync(queue1);
  expect(count).toEqual({
    acknowledged: 0,
    deadLettered: 0,
    pending: { 'my-group': 1 },
    scheduled: 0,
  });

  const pendingMessages = promisifyAll(new QueuePendingMessages());
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

  const consumer = promisifyAll(new Consumer());
  await consumer.consumeAsync(
    { queue: queue1, groupId: 'my-group' },
    (msg, cb) => cb(),
  );
  await consumer.runAsync();
  await delay(5000);

  const count2 = await queueMessages.countMessagesByStatusAsync(queue1);
  expect(count2).toEqual({
    acknowledged: 1,
    deadLettered: 0,
    pending: { 'my-group': 0 },
    scheduled: 0,
  });

  await consumer.shutdownAsync();
  await producer.shutdownAsync();
});
