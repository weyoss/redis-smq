/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test, vitest } from 'vitest';
import { ICallback } from 'redis-smq-common';
import {
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/index.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageAcknowledged } from '../../common/events.js';
import { getDefaultQueue } from '../../common/message-producing-consuming.js';
import { getMessageManager } from '../../common/message-manager.js';
import { getProducer } from '../../common/producer.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { getQueueManager } from '../../common/queue-manager.js';

test('Combined test. Requeue a priority message from acknowledged queue. Check queue metrics.', async () => {
  const defaultQueue = getDefaultQueue();
  const queue = await getQueueManager();
  await queue.saveAsync(
    defaultQueue,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const consumer = getConsumer({
    queue: defaultQueue,
    messageHandler: vitest.fn(
      (msg: IMessageTransferable, cb: ICallback<void>) => {
        setTimeout(() => cb(), 5000);
      },
    ),
  });

  const msg = new ProducibleMessage();
  msg
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue)
    .setPriority(EMessagePriority.ABOVE_NORMAL);

  const producer = getProducer();
  await producer.runAsync();

  const [id] = await producer.produceAsync(msg);

  consumer.run(() => void 0);
  await untilMessageAcknowledged(consumer);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const res2 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.totalItems).toBe(1);
  expect(res2.items.length).toBe(1);

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(count.pending).toBe(0);
  expect(count.acknowledged).toBe(1);

  const message = await getMessageManager();
  const newMessageId = await message.requeueMessageByIdAsync(id);

  const count2 = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(count2.pending).toBe(1);
  expect(count2.acknowledged).toBe(1);

  const res6 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res6.totalItems).toBe(1);
  expect(res6.items.length).toBe(1);

  const pendingMessages = await getQueuePendingMessages();
  const res7 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res7.totalItems).toBe(1);
  expect(res7.items.length).toBe(1);
  expect(res7.items[0].id).toEqual(newMessageId);
});
