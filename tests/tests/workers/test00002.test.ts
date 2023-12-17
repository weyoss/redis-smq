/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { delay, promisifyAll } from 'bluebird';
import { ProducibleMessage } from '../../../src/lib/message/producible-message';
import { RequeueUnacknowledgedWorker } from '../../../src/workers/requeue-unacknowledged.worker';
import { WatchConsumersWorker } from '../../../src/workers/watch-consumers.worker';
import { untilConsumerEvent } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getRedisInstance } from '../../common/redis';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { logger } from '../../common/logger';
import { shutDownBaseInstance } from '../../common/base-instance';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';
import { IConsumableMessage } from '../../../types';

test('WatchdogWorker -> RequeueUnacknowledgedWorker', async () => {
  await createQueue(defaultQueue, false);

  let message: IConsumableMessage | null = null;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg) => {
      message = msg;
      setTimeout(() => consumer.shutdown(), 5000);
    }),
  });

  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(
    new ProducibleMessage()
      .setRetryDelay(0)
      .setBody('message body')
      .setQueue(defaultQueue),
  );

  consumer.run();
  await untilConsumerEvent(consumer, 'down');
  await shutDownBaseInstance(consumer);
  expect(message !== null).toBe(true);

  const redisClient = await getRedisInstance();

  // should move message from processing queue to delay queue
  const watchdogWorker = promisifyAll(
    new WatchConsumersWorker(redisClient, false, logger),
  );
  watchdogWorker.run();
  await delay(5000);

  // should move from delay queue to scheduled queue
  const requeueWorker = promisifyAll(
    new RequeueUnacknowledgedWorker(redisClient, false),
  );
  requeueWorker.run();
  await delay(5000);

  const pendingMessages = await getQueuePendingMessages();
  const res3 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res3.totalItems).toBe(1);

  await requeueWorker.quitAsync();
  await watchdogWorker.quitAsync();
});
