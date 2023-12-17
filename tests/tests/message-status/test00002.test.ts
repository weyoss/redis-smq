/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EMessagePropertyStatus, ProducibleMessage } from '../../../index';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { EQueueType } from '../../../types';
import { getConsumer } from '../../common/consumer';
import { untilMessageDeadLettered } from '../../common/events';
import { promisifyAll } from 'bluebird';
import { Message } from '../../../src/lib/message/message';

test('Message status: UNPUBLISHED -> PENDING -> PROCESSING -> DEAD_LETTERED', async () => {
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

  const producer = getProducer();
  await producer.runAsync();
  const msg = new ProducibleMessage();

  msg.setBody({ hello: 'world' }).setQueue(defaultQueue).setRetryThreshold(0);
  const [id] = await producer.produceAsync(msg);

  const message = promisifyAll(new Message());
  const msg0 = await message.getMessageStatusAsync(id);
  expect(msg0).toBe(EMessagePropertyStatus.PENDING);

  const consumer = getConsumer({ consumeDefaultQueue: false });
  const msg1: EMessagePropertyStatus[] = [];
  await consumer.consumeAsync(defaultQueue, (msg, cb) => {
    msg1.push(msg.getStatus());
    cb(new Error());
  });

  consumer.run();
  await untilMessageDeadLettered(consumer);
  expect(msg1[0]).toBe(EMessagePropertyStatus.PROCESSING);

  const msg2 = await message.getMessageStatusAsync(id);
  expect(msg2).toBe(EMessagePropertyStatus.DEAD_LETTERED);
});
