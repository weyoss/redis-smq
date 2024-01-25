/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
} from '../../types';
import { ProducibleMessage } from '../../src/lib/message/producible-message';
import { untilConsumerEvent, untilMessageAcknowledged } from './events';
import { getConsumer } from './consumer';
import { getProducer } from './producer';
import { fork } from 'child_process';
import * as path from 'path';
import { getQueue } from './queue';
import { Configuration } from '../../src/config/configuration';

export const defaultQueue: IQueueParams = {
  name: 'test_queue',
  ns: Configuration.getSetConfig().namespace,
};

export async function produceAndAcknowledgeMessage(
  queue: IQueueParams = defaultQueue,
) {
  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    queue,
    messageHandler: jest.fn((msg, cb) => {
      cb();
    }),
  });

  const message = new ProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const [messageId] = await producer.produceAsync(message);

  consumer.run();
  await untilMessageAcknowledged(consumer);
  return { producer, consumer, queue, messageId };
}

export async function produceAndDeadLetterMessage(
  queue: IQueueParams = defaultQueue,
) {
  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    queue,
    messageHandler: jest.fn(() => {
      throw new Error('Explicit error');
    }),
  });

  const message = new ProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const [messageId] = await producer.produceAsync(message);

  consumer.run();
  await untilConsumerEvent(consumer, 'messageDeadLettered');
  return { producer, consumer, messageId, queue };
}

export async function produceMessage(queue: IQueueParams = defaultQueue) {
  const producer = getProducer();
  await producer.runAsync();

  const message = new ProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const [messageId] = await producer.produceAsync(message);
  return { producer, messageId, queue };
}

export async function produceMessageWithPriority(
  queue: IQueueParams = defaultQueue,
) {
  const producer = getProducer();
  await producer.runAsync();

  const message = new ProducibleMessage();
  message.setPriority(EMessagePriority.LOW).setQueue(queue);
  const [messageId] = await producer.produceAsync(message);
  return { messageId, producer, queue };
}

export async function scheduleMessage(queue: IQueueParams = defaultQueue) {
  const producer = getProducer();
  await producer.runAsync();

  const message = new ProducibleMessage();
  message.setScheduledDelay(10000).setQueue(queue);
  const [messageId] = await producer.produceAsync(message);
  return { messageId, producer, queue };
}

export async function createQueue(
  queue: string | IQueueParams,
  mixed: boolean | EQueueType,
): Promise<void> {
  const queueInstance = await getQueue();
  const type =
    typeof mixed === 'boolean'
      ? mixed
        ? EQueueType.PRIORITY_QUEUE
        : EQueueType.LIFO_QUEUE
      : mixed;
  await queueInstance.saveAsync(
    queue,
    type,
    EQueueDeliveryModel.POINT_TO_POINT,
  );
}

export async function crashAConsumerConsumingAMessage() {
  await new Promise((resolve) => {
    const thread = fork(path.join(__dirname, 'consumer-thread.js'));
    thread.on('error', () => void 0);
    thread.on('exit', resolve);
  });
}
