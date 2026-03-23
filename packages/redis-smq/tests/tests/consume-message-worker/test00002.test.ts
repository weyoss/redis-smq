/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
  Consumer,
  EQueueDeliveryModel,
  EQueueType,
  Producer,
  ProducibleMessage,
} from '../../../src/index.js';
import { getQueueMessages } from '../../common/queue-messages.js';
import { getQueueManager } from '../../common/queue-manager.js';
import {
  MessageHandlerFileError,
  MessageHandlerFilenameExtensionError,
} from '../../../src/errors/index.js';

it('ConsumeMessageWorker: case 2', async () => {
  const consumer = bluebird.promisifyAll(new Consumer());
  await consumer.run();

  const queue1 = 'test';
  const queue = await getQueueManager();
  await queue.save(
    queue1,
    EQueueType.FIFO_QUEUE,
    EQueueDeliveryModel.POINT_TO_POINT,
  );

  const handlerFilename = path.resolve(
    env.getCurrentDir(),
    '../../common/non-existent-handler.js',
  );

  await expect(consumer.consume(queue1, handlerFilename)).rejects.toThrow(
    MessageHandlerFileError,
  );

  const handlerFilename2 = path.resolve(
    env.getCurrentDir(),
    '../../common/non-existent-handler.jsf',
  );

  await expect(consumer.consume(queue1, handlerFilename2)).rejects.toThrow(
    MessageHandlerFilenameExtensionError,
  );

  const handlerFilename3 = path.resolve(
    env.getCurrentDir(),
    '../../common/message-handler-worker-unacks.js',
  );
  await consumer.consume(queue1, handlerFilename3);

  const producer = bluebird.promisifyAll(new Producer());
  await producer.run();

  await producer.produce(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await bluebird.delay(5000);

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatus(queue1);
  expect(count).toEqual({
    acknowledged: 0,
    deadLettered: 1,
    pending: 0,
    scheduled: 0,
  });

  await consumer.cancel(queue1);

  const handlerFilename4 = path.resolve(
    env.getCurrentDir(),
    '../../common/message-handler-worker-unacks-exception.js',
  );
  await consumer.consume(queue1, handlerFilename4);

  await producer.produce(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await bluebird.delay(5000);

  const count2 = await queueMessages.countMessagesByStatus(queue1);
  expect(count2).toEqual({
    acknowledged: 0,
    deadLettered: 2,
    pending: 0,
    scheduled: 0,
  });

  await consumer.cancel(queue1);

  const handlerFilename5 = path.resolve(
    env.getCurrentDir(),
    '../../common/message-handler-worker-faulty.js',
  );
  await consumer.consume(queue1, handlerFilename5);

  await producer.produce(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await bluebird.delay(5000);

  await consumer.cancel(queue1);

  const handlerFilename6 = path.resolve(
    env.getCurrentDir(),
    '../../common/message-handler-worker-faulty-exit.js',
  );
  await consumer.consume(queue1, handlerFilename6);

  await producer.produce(
    new ProducibleMessage()
      .setQueue(queue1)
      .setBody('123')
      .setRetryThreshold(0),
  );

  await bluebird.delay(5000);

  await consumer.shutdown();
  await producer.shutdown();
});
