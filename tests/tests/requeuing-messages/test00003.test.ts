/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect, jest } from '@jest/globals';
import { ICallback } from 'redis-smq-common';
import {
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
  IMessageTransferable,
  MessageMessageNotRequeuableError,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageAcknowledged } from '../../common/events.js';
import { defaultQueue } from '../../common/message-producing-consuming.js';
import { getMessage } from '../../common/message.js';
import { getProducer } from '../../common/producer.js';
import { getQueue } from '../../common/queue.js';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';

test('Combined test. Requeue a priority message from acknowledged queue. Check queue metrics.', async () => {
  const queue = await getQueue();
  await queue.saveAsync(
    defaultQueue,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const consumer = getConsumer({
    queue: defaultQueue,
    messageHandler: jest.fn(
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

  const message = await getMessage();
  await message.requeueMessageByIdAsync(id);

  const count2 = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(count2.pending).toBe(1);
  expect(count2.acknowledged).toBe(0);

  const res6 = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res6.totalItems).toBe(0);
  expect(res6.items.length).toBe(0);

  const pendingMessages = await getQueuePendingMessages();
  const res7 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res7.totalItems).toBe(1);
  expect(res7.items.length).toBe(1);
  expect(res7.items[0].id).toEqual(id);

  await expect(message.requeueMessageByIdAsync(id)).rejects.toThrow(
    MessageMessageNotRequeuableError,
  );
});
