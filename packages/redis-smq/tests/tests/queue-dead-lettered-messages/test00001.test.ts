/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { ProducibleMessage } from '../../../src/index.js';
import { getConsumer } from '../../common/consumer.js';
import { untilMessageDeadLettered } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages.js';
import { getQueueMessages } from '../../common/queue-messages.js';

test('Queue dead-lettered message', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(getDefaultQueue());

  const [id] = await producer.produceAsync(msg);

  const consumer = getConsumer({
    messageHandler: (msg1, cb) => cb(new Error()),
  });
  consumer.run(() => void 0);
  await untilMessageDeadLettered(consumer, id);

  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const count =
    await deadLetteredMessages.countMessagesAsync(getDefaultQueue());
  expect(count).toEqual(1);

  const messages = await deadLetteredMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(Object.keys(messages)).toEqual(['totalItems', 'items']);
  expect(messages.totalItems).toBe(1);
  expect(messages.items.length).toBe(1);
  expect(messages.items[0].id).toBe(id);

  const queueMessages = await getQueueMessages();
  const count1 = await queueMessages.countMessagesAsync(getDefaultQueue());
  expect(count1).toBe(1);

  const count2 =
    await queueMessages.countMessagesByStatusAsync(getDefaultQueue());
  expect(count2).toEqual({
    pending: 0,
    acknowledged: 0,
    deadLettered: 1,
    scheduled: 0,
  });
});
