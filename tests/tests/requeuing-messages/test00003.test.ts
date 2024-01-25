/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { untilMessageAcknowledged } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import { defaultQueue } from '../../common/message-producing-consuming';
import {
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
} from '../../../types';
import { getQueue } from '../../common/queue';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages';
import { getQueueMessages } from '../../common/queue-messages';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';
import { QueueMessageRequeueError } from '../../../src/lib/queue/errors';

test('Combined test. Requeue a priority message from acknowledged queue. Check queue metrics.', async () => {
  const queue = await getQueue();
  await queue.saveAsync(
    defaultQueue,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const consumer = getConsumer({
    queue: defaultQueue,
    messageHandler: jest.fn((msg, cb) => {
      setTimeout(cb, 5000);
    }),
  });

  const message = new ProducibleMessage();
  message
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue)
    .setPriority(EMessagePriority.ABOVE_NORMAL);

  const producer = getProducer();
  await producer.runAsync();

  const [id] = await producer.produceAsync(message);

  consumer.run();
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

  await acknowledgedMessages.requeueMessageAsync(defaultQueue, id);

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
  expect(res7.items[0].getId()).toEqual(id);

  await expect(
    acknowledgedMessages.requeueMessageAsync(defaultQueue, id),
  ).rejects.toThrow(QueueMessageRequeueError);
});
