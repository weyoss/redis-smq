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
import { untilConsumerEvent } from '../../common/events';
import { promisifyAll } from 'bluebird';
import { Message } from '../../../src/lib/message/message';

test('Message status: UNPUBLISHED -> PENDING -> PROCESSING -> UNACK_REQUEUING -> ACKNOWLEDGED', async () => {
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

  const producer = getProducer();
  await producer.runAsync();
  const msg = new ProducibleMessage();

  msg
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue)
    .setRetryThreshold(2)
    .setRetryDelay(0);
  const [id] = await producer.produceAsync(msg);

  const message = promisifyAll(new Message());
  const msg0 = await message.getMessageByIdAsync(id);
  expect(msg0.status).toBe(EMessagePropertyStatus.PENDING);

  const consumer = getConsumer({ consumeDefaultQueue: false });
  const msg1: EMessagePropertyStatus[] = [];
  await consumer.consumeAsync(defaultQueue, (msg, cb) => {
    if (!msg1.length) {
      msg1.push(msg.status);
      cb(new Error());
    } else cb();
  });

  consumer.run();
  await untilConsumerEvent(consumer, 'messageUnacknowledged');
  await consumer.shutdownAsync();
  expect(msg1[0]).toBe(EMessagePropertyStatus.PROCESSING);

  const msg2 = await message.getMessageStatusAsync(id);
  expect(msg2).toBe(EMessagePropertyStatus.UNACK_REQUEUING);

  consumer.run();
  await untilConsumerEvent(consumer, 'messageAcknowledged');

  const msg3 = await message.getMessageStatusAsync(id);
  expect(msg3).toBe(EMessagePropertyStatus.ACKNOWLEDGED);
});
