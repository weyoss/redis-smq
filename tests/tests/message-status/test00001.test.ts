/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EMessagePropertyStatus, MessageEnvelope } from '../../../index';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { EQueueType } from '../../../types';
import { getConsumer } from '../../common/consumer';
import { untilMessageAcknowledged } from '../../common/events';
import { promisifyAll } from 'bluebird';
import { Message } from '../../../src/lib/message/message';

test('MessageEnvelope status: UNPUBLISHED -> PENDING -> PROCESSING -> ACKNOWLEDGED', async () => {
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

  const producer = getProducer();
  await producer.runAsync();
  const msg = new MessageEnvelope();
  expect(msg.getStatus()).toBe(EMessagePropertyStatus.UNPUBLISHED);

  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);
  const { messages } = await producer.produceAsync(msg);

  const message = promisifyAll(new Message());
  const msg0 = await message.getMessageByIdAsync(messages[0]);
  expect(msg0.getStatus()).toBe(EMessagePropertyStatus.PENDING);

  const consumer = getConsumer({ consumeDefaultQueue: false });
  const msg1: MessageEnvelope[] = [];
  await consumer.consumeAsync(defaultQueue, (msg, cb) => {
    msg1.push(msg);
    cb();
  });

  consumer.run();
  await untilMessageAcknowledged(consumer);
  expect(msg1[0].getStatus()).toBe(EMessagePropertyStatus.PROCESSING);

  const msg2 = await message.getMessageByIdAsync(messages[0]);
  expect(msg2.getStatus()).toBe(EMessagePropertyStatus.ACKNOWLEDGED);
});