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

it('ConsumeMessageWorker: case 1', async () => {
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
    '../../common/message-handler-worker-acks.js',
  );
  await consumer.consumeAsync(queue1, handlerFilename);

  const producer = promisifyAll(new Producer());
  await producer.runAsync();

  await producer.produceAsync(
    new ProducibleMessage().setQueue(queue1).setBody('123'),
  );

  await delay(5000);

  const queueMessages = promisifyAll(new QueueMessages());
  const count = await queueMessages.countMessagesByStatusAsync(queue1);
  expect(count).toEqual({
    acknowledged: 1,
    deadLettered: 0,
    pending: 0,
    scheduled: 0,
  });

  await consumer.shutdownAsync();
  await producer.shutdownAsync();
});
