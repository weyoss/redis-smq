/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test, vitest } from 'vitest';
import bluebird from 'bluebird';
import { ICallback } from 'redis-smq-common';
import {
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/index.js';
import { getConsumer } from '../../common/consumer.js';
import { getDefaultQueue } from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueue } from '../../common/queue.js';

test('Priority queuing: case 2', async () => {
  const defaultQueue = getDefaultQueue();
  const consumedMessages: string[] = [];

  const queue = await getQueue();
  await queue.saveAsync(
    defaultQueue,
    EQueueType.PRIORITY_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const consumer = bluebird.promisifyAll(
    getConsumer({
      queue: defaultQueue,
      messageHandler: vitest.fn(
        (msg: IMessageTransferable, cb: ICallback<void>) => {
          consumedMessages.push(msg.id);
          cb();
        },
      ),
    }),
  );

  const producer = getProducer();
  await producer.runAsync();

  // message 1
  const msg1 = new ProducibleMessage();
  msg1.setBody({ testing: 'message with low priority' });
  msg1.setPriority(EMessagePriority.LOW);
  msg1.setQueue(getDefaultQueue());
  const [id1] = await producer.produceAsync(msg1);

  // message 2
  const msg2 = new ProducibleMessage();
  msg2.setBody({ testing: 'a message with very low priority' });
  msg2.setPriority(EMessagePriority.VERY_LOW);
  msg2.setQueue(defaultQueue);
  const [id2] = await producer.produceAsync(msg2);

  // message 3
  const msg3 = new ProducibleMessage();
  msg3.setBody({ testing: 'a message with above normal priority' });
  msg3.setPriority(EMessagePriority.ABOVE_NORMAL);
  msg3.setQueue(defaultQueue);
  const [id3] = await producer.produceAsync(msg3);

  // message 4
  const msg4 = new ProducibleMessage();
  msg4.setBody({ testing: 'a message with normal priority' });
  msg4.setPriority(EMessagePriority.NORMAL);
  msg4.setQueue(defaultQueue);
  const [id4] = await producer.produceAsync(msg4);

  // message 5
  const msg5 = new ProducibleMessage();
  msg5.setBody({ testing: 'a message with high priority' });
  msg5.setPriority(EMessagePriority.HIGH);
  msg5.setQueue(defaultQueue);
  const [id5] = await producer.produceAsync(msg5);

  await consumer.runAsync();
  await bluebird.delay(10000);

  expect(consumedMessages.length).toBe(5);
  expect(consumedMessages[0]).toBe(id5);
  expect(consumedMessages[1]).toBe(id3);
  expect(consumedMessages[2]).toBe(id4);
  expect(consumedMessages[3]).toBe(id1);
  expect(consumedMessages[4]).toBe(id2);
});
