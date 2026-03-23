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

it('ConsumeMessageWorker: case 1', async () => {
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
    '../../common/message-handler-worker-acks.js',
  );
  await consumer.consume(queue1, handlerFilename);

  const producer = bluebird.promisifyAll(new Producer());
  await producer.run();

  await producer.produce(
    new ProducibleMessage().setQueue(queue1).setBody('123'),
  );

  await bluebird.delay(5000);

  const queueMessages = await getQueueMessages();
  const count = await queueMessages.countMessagesByStatus(queue1);
  expect(count).toEqual({
    acknowledged: 1,
    deadLettered: 0,
    pending: 0,
    scheduled: 0,
  });

  await consumer.shutdown();
  await producer.shutdown();
});
