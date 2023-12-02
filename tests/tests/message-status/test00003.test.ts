/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EMessagePropertyStatus, Message } from '../../../index';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { EQueueType } from '../../../types';
import { getQueueMessages } from '../../common/queue-messages';
import { getConsumer } from '../../common/consumer';
import { untilConsumerEvent } from '../../common/events';

test('Message status: UNPUBLISHED -> PENDING -> PROCESSING -> UNACK_DELAYING -> ACKNOWLEDGED', async () => {
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

  const producer = getProducer();
  await producer.runAsync();
  const msg = new Message();
  expect(msg.getStatus()).toBe(EMessagePropertyStatus.UNPUBLISHED);

  msg
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue)
    .setRetryThreshold(2)
    .setRetryDelay(5000);
  const { messages } = await producer.produceAsync(msg);

  const queueMessages = await getQueueMessages();
  const msg0 = await queueMessages.getMessageByIdAsync(messages[0]);
  expect(msg0.getStatus()).toBe(EMessagePropertyStatus.PENDING);

  const consumer = getConsumer({ consumeDefaultQueue: false });
  const msg1: Message[] = [];
  await consumer.consumeAsync(defaultQueue, (msg, cb) => {
    if (!msg1.length) {
      msg1.push(msg);
      cb(new Error());
    } else cb();
  });

  consumer.run();

  await untilConsumerEvent(consumer, 'messageUnacknowledged');
  expect(msg1[0].getStatus()).toBe(EMessagePropertyStatus.PROCESSING);
  const msg2 = await queueMessages.getMessageByIdAsync(messages[0]);
  expect(msg2.getStatus()).toBe(EMessagePropertyStatus.UNACK_DELAYING);

  await untilConsumerEvent(consumer, 'messageAcknowledged');
  const msg3 = await queueMessages.getMessageByIdAsync(messages[0]);
  expect(msg3.getStatus()).toBe(EMessagePropertyStatus.ACKNOWLEDGED);
});
