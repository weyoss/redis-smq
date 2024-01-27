/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { delay } from 'bluebird';
import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { untilConsumerEvent } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages';

test('Setting default message TTL from configuration', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');

  let unacks = 0;
  consumer.on('messageUnacknowledged', () => {
    unacks += 1;
  });
  const msg = new ProducibleMessage();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue).setTTL(2000);

  const [id] = await producer.produceAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerEvent(consumer, 'messageDeadLettered');

  expect(consume).toHaveBeenCalledTimes(0);
  expect(unacks).toBe(1);
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const list = await deadLetteredMessages.getMessagesAsync(
    defaultQueue,
    0,
    100,
  );
  expect(list.totalItems).toBe(1);
  expect(list.items[0].id).toBe(id);
});
