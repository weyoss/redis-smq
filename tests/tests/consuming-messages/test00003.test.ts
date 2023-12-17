/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ProducibleMessage } from '../../../index';
import { delay } from 'bluebird';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { EQueueType } from '../../../types';

test('Produce and consume 100 message: LIFO Queues', async () => {
  await createQueue(defaultQueue, EQueueType.LIFO_QUEUE);

  const producer = await getProducer();
  await producer.runAsync();

  const total = 100;
  const publishedMsg: string[] = [];
  for (let i = 0; i < total; i += 1) {
    const msg = new ProducibleMessage();
    msg.setBody({ hello: 'world' }).setQueue(defaultQueue);
    const [id] = await producer.produceAsync(msg);
    publishedMsg.push(id);
  }

  const deliveredMessages: string[] = [];
  const consumer = getConsumer({
    messageHandler: (msg, cb) => {
      deliveredMessages.push(msg.getId());
      cb();
    },
  });
  await consumer.runAsync();
  await delay(20000);

  expect(deliveredMessages.length).toEqual(publishedMsg.length);
  for (let i = 0; i < total; i += 1) {
    expect(publishedMsg[i]).toStrictEqual(deliveredMessages[total - i - 1]);
  }
});
