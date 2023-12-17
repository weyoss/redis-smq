/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getProducer } from '../../common/producer';
import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { getQueueMessages } from '../../common/queue-messages';
import { getQueueAcknowledgedMessages } from '../../common/queue-acknowledged-messages';
import { getConsumer } from '../../common/consumer';
import { untilMessageAcknowledged } from '../../common/events';

test('Acknowledged message', async () => {
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  const [id] = await producer.produceAsync(msg);

  const consumer = getConsumer({
    messageHandler: (msg1, cb) => cb(),
  });
  consumer.run();
  await untilMessageAcknowledged(consumer, id);

  const acknowledgedMessages = await getQueueAcknowledgedMessages();
  const count = await acknowledgedMessages.countMessagesAsync(defaultQueue);
  expect(count).toEqual(1);

  const messages = await acknowledgedMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(Object.keys(messages)).toEqual(['cursor', 'totalItems', 'items']);
  expect(messages.cursor).toBe(0);
  expect(messages.totalItems).toBe(1);
  expect(messages.items.length).toBe(1);
  expect(messages.items[0].getId()).toBe(id);

  const queueMessages = await getQueueMessages();
  const count1 = await queueMessages.countMessagesAsync(defaultQueue);
  expect(count1).toBe(1);

  const count2 = await queueMessages.countMessagesByStatusAsync(defaultQueue);
  expect(count2).toEqual({
    pending: 0,
    acknowledged: 1,
    deadLettered: 0,
    scheduled: 0,
  });
});
