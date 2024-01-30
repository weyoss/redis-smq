/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { delay, promisifyAll } from 'bluebird';
import { Consumer } from '../../../src/lib/consumer/consumer';
import { Queue } from '../../../src/lib/queue/queue/queue';
import { EQueueDeliveryModel, EQueueType } from '../../../types';
import path from 'path';
import { Producer } from '../../../src/lib/producer/producer';
import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { QueueMessages } from '../../../src/lib/queue/queue-messages/queue-messages';
import {
  ConsumerMessageHandlerFilenameExtensionError,
  ConsumerMessageHandlerFileError,
} from '../../../src/lib/consumer/message-handler/errors';

it('ConsumeMessageWorker: case 2', async () => {
  const consumer = promisifyAll(new Consumer());
  await consumer.runAsync();

  const queue1 = 'test';
  const queue = promisifyAll(new Queue());
  await queue.saveAsync(
    queue1,
    EQueueType.FIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const handlerFilename = path.resolve(
    __dirname,
    '../../common/non-existent-handler.js',
  );

  await expect(consumer.consumeAsync(queue1, handlerFilename)).rejects.toThrow(
    ConsumerMessageHandlerFileError,
  );

  const handlerFilename2 = path.resolve(
    __dirname,
    '../../common/non-existent-handler.jsf',
  );

  await expect(consumer.consumeAsync(queue1, handlerFilename2)).rejects.toThrow(
    ConsumerMessageHandlerFilenameExtensionError,
  );

  const handlerFilename3 = path.resolve(
    __dirname,
    '../../common/message-handler-worker-unacks.js',
  );
  await consumer.consumeAsync(queue1, handlerFilename3);

  const producer = promisifyAll(new Producer());
  await producer.runAsync();

  await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await delay(5000);

  const queueMessages = promisifyAll(new QueueMessages());
  const count = await queueMessages.countMessagesByStatusAsync(queue1);
  expect(count).toEqual({
    acknowledged: 0,
    deadLettered: 1,
    pending: 0,
    scheduled: 0,
  });

  await consumer.cancelAsync(queue1);

  const handlerFilename4 = path.resolve(
    __dirname,
    '../../common/message-handler-worker-unacks-exception.js',
  );
  await consumer.consumeAsync(queue1, handlerFilename4);

  await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await delay(5000);

  const count2 = await queueMessages.countMessagesByStatusAsync(queue1);
  expect(count2).toEqual({
    acknowledged: 0,
    deadLettered: 2,
    pending: 0,
    scheduled: 0,
  });

  await consumer.cancelAsync(queue1);

  const handlerFilename5 = path.resolve(
    __dirname,
    '../../common/message-handler-worker-faulty.js',
  );
  await consumer.consumeAsync(queue1, handlerFilename5);

  await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await delay(5000);

  await consumer.cancelAsync(queue1);

  const handlerFilename6 = path.resolve(
    __dirname,
    '../../common/message-handler-worker-faulty-exit.js',
  );
  await consumer.consumeAsync(queue1, handlerFilename6);

  await producer.produceAsync(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await delay(5000);

  await consumer.shutdownAsync();
  await producer.shutdownAsync();
});
