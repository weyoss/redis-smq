/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import bluebird from 'bluebird';
import path from 'path';
import { env } from 'redis-smq-common';
import {
  ConsumerMessageHandlerFileError,
  ConsumerMessageHandlerFilenameExtensionError,
} from '../../../src/consumer/message-handler/errors/index.js';
import {
  Consumer,
  EQueueDeliveryModel,
  EQueueType,
  Producer,
  ProducibleMessage,
} from '../../../src/index.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueue } from '../../common/queue.js';

it('ConsumeMessageWorker: case 2', async () => {
  const consumer = bluebird.promisifyAll(new Consumer());
  await consumer.runAsync();

  const queue1 = 'test';
  const queue = await getQueue();
  await queue.saveAsync(
    queue1,
    EQueueType.FIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const handlerFilename = path.resolve(
    env.getCurrentDir(),
    '../../common/non-existent-handler.js',
  );

  await expect(consumer.consumeAsync(queue1, handlerFilename)).rejects.toThrow(
    ConsumerMessageHandlerFileError,
  );

  const handlerFilename2 = path.resolve(
    env.getCurrentDir(),
    '../../common/non-existent-handler.jsf',
  );

  await expect(consumer.consumeAsync(queue1, handlerFilename2)).rejects.toThrow(
    ConsumerMessageHandlerFilenameExtensionError,
  );

  const handlerFilename3 = path.resolve(
    env.getCurrentDir(),
    '../../common/message-handler-worker-unacks.js',
  );
  await consumer.consumeAsync(queue1, handlerFilename3);

  const producer = bluebird.promisifyAll(new Producer());
  await producer.runAsync();

  await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await bluebird.delay(5000);

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatusAsync(queue1);
  expect(count).toEqual({
    acknowledged: 0,
    deadLettered: 1,
    pending: 0,
    scheduled: 0,
  });

  await consumer.cancelAsync(queue1);

  const handlerFilename4 = path.resolve(
    env.getCurrentDir(),
    '../../common/message-handler-worker-unacks-exception.js',
  );
  await consumer.consumeAsync(queue1, handlerFilename4);

  await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await bluebird.delay(5000);

  const count2 = await queueMessages.countMessagesByStatusAsync(queue1);
  expect(count2).toEqual({
    acknowledged: 0,
    deadLettered: 2,
    pending: 0,
    scheduled: 0,
  });

  await consumer.cancelAsync(queue1);

  const handlerFilename5 = path.resolve(
    env.getCurrentDir(),
    '../../common/message-handler-worker-faulty.js',
  );
  await consumer.consumeAsync(queue1, handlerFilename5);

  await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await bluebird.delay(5000);

  await consumer.cancelAsync(queue1);

  const handlerFilename6 = path.resolve(
    env.getCurrentDir(),
    '../../common/message-handler-worker-faulty-exit.js',
  );
  await consumer.consumeAsync(queue1, handlerFilename6);

  await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await bluebird.delay(5000);

  await consumer.shutdownAsync();
  await producer.shutdownAsync();
});
