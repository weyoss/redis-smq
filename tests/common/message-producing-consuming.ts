/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EQueueType, IQueueParams } from '../../types';
import { MessageEnvelope } from '../../src/lib/message/message-envelope';
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

  const message = new MessageEnvelope();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const { messages } = await producer.produceAsync(message);

  consumer.run();
  await untilMessageAcknowledged(consumer);
  return { producer, consumer, queue, messageId: messages[0] };
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

  const message = new MessageEnvelope();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const { messages } = await producer.produceAsync(message);

  consumer.run();
  await untilConsumerEvent(consumer, 'messageDeadLettered');
  return { producer, consumer, messageId: messages[0], queue };
}

export async function produceMessage(queue: IQueueParams = defaultQueue) {
  const producer = getProducer();
  await producer.runAsync();

  const message = new MessageEnvelope();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const { messages } = await producer.produceAsync(message);
  return { producer, messageId: messages[0], queue };
}

export async function produceMessageWithPriority(
  queue: IQueueParams = defaultQueue,
) {
  const producer = getProducer();
  await producer.runAsync();

  const message = new MessageEnvelope();
  message.setPriority(MessageEnvelope.MessagePriority.LOW).setQueue(queue);
  const { messages } = await producer.produceAsync(message);
  return { messageId: messages[0], producer, queue };
}

export async function scheduleMessage(queue: IQueueParams = defaultQueue) {
  const producer = getProducer();
  await producer.runAsync();

  const message = new MessageEnvelope();
  message.setScheduledDelay(10000).setQueue(queue);
  const { messages } = await producer.produceAsync(message);
  return { messageId: messages[0], producer, queue };
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
  await queueInstance.saveAsync(queue, type);
}

export async function crashAConsumerConsumingAMessage() {
  await new Promise((resolve) => {
    const thread = fork(path.join(__dirname, 'consumer-thread.js'));
    thread.on('error', () => void 0);
    thread.on('exit', resolve);
  });
}
