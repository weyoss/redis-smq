/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { fork } from 'child_process';
import path from 'path';
import { env, ICallback } from 'redis-smq-common';
import {
  Configuration,
  EMessagePriority,
  EQueueDeliveryModel,
  EQueueType,
  IMessageTransferable,
  IQueueParams,
  ProducibleMessage,
} from '../../src/index.js';
import { config } from './config.js';
import { getConsumer } from './consumer.js';
import {
  untilMessageAcknowledged,
  untilMessageDeadLettered,
} from './events.js';
import { getProducer } from './producer.js';
import { getQueueManager } from './queue-manager.js';

export function getDefaultQueue() {
  return {
    name: 'test_queue',
    ns: Configuration.getConfig().namespace,
  };
}

export async function produceAndAcknowledgeMessage(
  queue: IQueueParams = getDefaultQueue(),
  autoShutdown = false,
) {
  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    queue,
    messageHandler: (msg: IMessageTransferable, cb: ICallback<void>) => cb(),
  });

  const message = new ProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const [messageId] = await producer.produceAsync(message);

  consumer.run(() => void 0);
  await untilMessageAcknowledged(consumer);

  if (autoShutdown) {
    await producer.shutdownAsync();
    await consumer.shutdownAsync();
  }

  return { producer, consumer, queue, messageId };
}

export async function produceAndDeadLetterMessage(
  queue: IQueueParams = getDefaultQueue(),
  autoShutdown = false,
) {
  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    queue,
    messageHandler: () => {
      throw new Error('Explicit error');
    },
  });

  const message = new ProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const [messageId] = await producer.produceAsync(message);

  consumer.run(() => void 0);
  await untilMessageDeadLettered(consumer);

  if (autoShutdown) {
    await producer.shutdownAsync();
    await consumer.shutdownAsync();
  }

  return { producer, consumer, messageId, queue };
}

export async function produceMessage(queue: IQueueParams = getDefaultQueue()) {
  const producer = getProducer();
  await producer.runAsync();

  const message = new ProducibleMessage();
  message.setBody({ hello: 'world' }).setQueue(queue);
  const [messageId] = await producer.produceAsync(message);
  return { producer, messageId, queue };
}

export async function produceMessageWithPriority(
  queue: IQueueParams = getDefaultQueue(),
) {
  const producer = getProducer();
  await producer.runAsync();

  const message = new ProducibleMessage();
  message.setPriority(EMessagePriority.LOW).setQueue(queue);
  const [messageId] = await producer.produceAsync(message);
  return { messageId, producer, queue };
}

export async function scheduleMessage(queue: IQueueParams = getDefaultQueue()) {
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
  const queueInstance = await getQueueManager();
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
    const thread = fork(path.join(env.getCurrentDir(), 'consumer-thread.js'));
    thread.send(JSON.stringify(config));
    thread.on('error', () => void 0);
    thread.on('exit', resolve);
  });
}
