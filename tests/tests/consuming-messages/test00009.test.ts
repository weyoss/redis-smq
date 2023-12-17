/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { delay } from 'bluebird';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages';

test('A message is dead-lettered when messageRetryThreshold is exceeded', async () => {
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    messageHandler: jest.fn(() => {
      throw new Error('Explicit error');
    }),
  });

  let unacknowledged = 0;
  consumer.on('messageUnacknowledged', () => {
    unacknowledged += 1;
  });

  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  const [id] = await producer.produceAsync(msg);
  consumer.run();

  await delay(30000);
  expect(unacknowledged).toBe(3);
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const list = await deadLetteredMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(list.totalItems).toBe(1);
  expect(list.items[0].getId()).toBe(id);
});
