/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, vitest, test } from 'vitest';
import bluebird from 'bluebird';
import {
  Consumer,
  EQueueDeliveryModel,
  EQueueType,
  Producer,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import { getQueue } from '../../common/queue.js';

test('Health check: case 3', async () => {
  const queueName = `queue_${Date.now()}`;
  const queue = await getQueue();
  await queue.saveAsync(
    queueName,
    EQueueType.LIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const producerUpMock = vitest.fn();
  const producerDownMock = vitest.fn();
  const producerGoingUpMock = vitest.fn();
  const producerGoingDownMock = vitest.fn();

  const producer = bluebird.promisifyAll(new Producer());
  producer.on('producer.up', producerUpMock);
  producer.on('producer.down', producerDownMock);
  producer.on('producer.goingDown', producerGoingDownMock);
  producer.on('producer.goingUp', producerGoingUpMock);
  await producer.runAsync();

  const produceForever = async () => {
    try {
      const message = new ProducibleMessage()
        .setBody('some data')
        .setQueue(queueName);
      await producer.produceAsync(message);
      await produceForever();
    } catch {
      /* empty */
    }
  };

  // not awaiting
  produceForever();

  const consumerUpMock = vitest.fn();
  const consumerDownMock = vitest.fn();
  const consumerGoingUpMock = vitest.fn();
  const consumerGoingDownMock = vitest.fn();

  const consumer = bluebird.promisifyAll(new Consumer());
  consumer.on('consumer.up', consumerUpMock);
  consumer.on('consumer.down', consumerDownMock);
  consumer.on('consumer.goingDown', consumerGoingDownMock);
  consumer.on('consumer.goingUp', consumerGoingUpMock);

  await consumer.consumeAsync(
    queueName, // using the default namespace
    (message, cb) => cb(),
  );

  await consumer.runAsync();
  await bluebird.delay(5000);
  await consumer.shutdownAsync();
  await consumer.runAsync();
  await bluebird.delay(10000);
  await consumer.shutdownAsync();
  await consumer.runAsync();
  await consumer.shutdownAsync();
  await consumer.runAsync();
  await consumer.shutdownAsync();
  await consumer.runAsync();
  await consumer.shutdownAsync();
  await consumer.runAsync();
  await consumer.shutdownAsync();
  await consumer.shutdownAsync();
  await producer.shutdownAsync();
  await producer.shutdownAsync();

  expect(producerGoingUpMock).toHaveBeenCalledTimes(1);
  expect(producerUpMock).toHaveBeenCalledTimes(1);
  expect(producerGoingDownMock).toHaveBeenCalledTimes(1);
  expect(producerDownMock).toHaveBeenCalledTimes(1);

  expect(consumerGoingUpMock).toHaveBeenCalledTimes(6);
  expect(consumerUpMock).toHaveBeenCalledTimes(6);
  expect(consumerGoingDownMock).toHaveBeenCalledTimes(6);
  expect(consumerDownMock).toHaveBeenCalledTimes(6);

  await queue.shutdownAsync();
});
