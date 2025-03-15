/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import { ICallback } from 'redis-smq-common';
import { IMessageTransferable, ProducibleMessage } from '../../../index.js';
import { EQueueType } from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

test('Produce and consume 100 message: FIFO Queues', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);

  const producer = getProducer();
  await producer.runAsync();

  const total = 100;
  const publishedMsg: string[] = [];
  for (let i = 0; i < total; i += 1) {
    const msg = new ProducibleMessage();
    msg.setBody({ hello: 'world' }).setQueue(getDefaultQueue());
    const [id] = await producer.produceAsync(msg);
    publishedMsg.push(id);
  }

  const deliveredMessages: string[] = [];
  const consumer = getConsumer({
    messageHandler: (msg: IMessageTransferable, cb: ICallback<void>) => {
      deliveredMessages.push(msg.id);
      cb();
    },
  });
  await consumer.runAsync();
  await bluebird.delay(20000);

  expect(deliveredMessages.length).toEqual(publishedMsg.length);
  for (let i = 0; i < total; i += 1) {
    expect(publishedMsg[i]).toStrictEqual(deliveredMessages[i]);
  }
});
