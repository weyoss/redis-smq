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
import {
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import { getEventBus } from '../../common/event-bus-redis.js';
import {
  crashAConsumerConsumingAMessage,
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';

type TQueueMetrics = {
  receivedMessages: string[];
  acks: number;
};

test('Given many queues, a message is recovered from a consumer crash and re-queued to its origin queue', async () => {
  const defaultQueue = getDefaultQueue();
  const eventBus = await getEventBus();
  await createQueue(defaultQueue, false);
  await createQueue('queue_b', false);

  const defaultQueueMetrics: TQueueMetrics = {
    receivedMessages: [],
    acks: 0,
  };
  const queueBMetrics: TQueueMetrics = {
    receivedMessages: [],
    acks: 0,
  };

  const queueAConsumer = getConsumer({
    queue: defaultQueue,
    messageHandler: (msg: IMessageTransferable, cb: ICallback<void>) => {
      defaultQueueMetrics.receivedMessages.push(msg.id);
      cb();
    },
  });
  eventBus.on('consumer.consumeMessage.messageAcknowledged', (...args) => {
    if (args[3] === queueAConsumer.getId()) defaultQueueMetrics.acks += 1;
  });
  await queueAConsumer.runAsync();

  const queueBConsumer = getConsumer({
    queue: 'queue_b',
    messageHandler: (msg: IMessageTransferable, cb: ICallback<void>) => {
      queueBMetrics.receivedMessages.push(msg.id);
      cb();
    },
  });
  eventBus.on('consumer.consumeMessage.messageAcknowledged', (...args) => {
    if (args[3] === queueBConsumer.getId()) queueBMetrics.acks += 1;
  });
  await queueBConsumer.runAsync();

  const producer = getProducer();
  await producer.runAsync();

  // Produce a message to QUEUE B
  const anotherMsg = new ProducibleMessage();
  anotherMsg.setBody({ id: 'b' }).setQueue('queue_b');
  const [id] = await producer.produceAsync(anotherMsg);

  // using defaultQueue
  await crashAConsumerConsumingAMessage();
  await bluebird.delay(10000);

  expect(defaultQueueMetrics.acks).toBe(1);
  expect(defaultQueueMetrics.receivedMessages.length).toBe(1);

  expect(queueBMetrics.acks).toBe(1);
  expect(queueBMetrics.receivedMessages.length).toBe(1);
  expect(queueBMetrics.receivedMessages[0]).toBe(id);
});
