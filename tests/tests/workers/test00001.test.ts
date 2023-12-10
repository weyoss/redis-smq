/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { delay, promisifyAll } from 'bluebird';
import { MessageEnvelope } from '../../../src/lib/message/message-envelope';
import { DelayUnacknowledgedWorker } from '../../../src/workers/delay-unacknowledged.worker';
import { PublishScheduledWorker } from '../../../src/workers/publish-scheduled.worker';
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
import { getQueueScheduledMessages } from '../../common/queue-scheduled-messages';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';

test('WatchdogWorker -> DelayUnacknowledgedWorker -> PublishScheduledWorker', async () => {
  await createQueue(defaultQueue, false);

  let message: MessageEnvelope | null = null;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg) => {
      message = msg;
      setTimeout(() => consumer.shutdown(), 5000);
    }),
  });

  const producer = getProducer();
  await producer.runAsync();
  await producer.produceAsync(
    new MessageEnvelope()
      .setRetryDelay(10000)
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
  const delayHandler = promisifyAll(
    new DelayUnacknowledgedWorker(redisClient, false),
  );
  delayHandler.run();
  await delay(5000);

  const scheduledMessages = await getQueueScheduledMessages();
  const res = await scheduledMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res.totalItems).toBe(1);

  // should move from delay queue to scheduled queue
  const scheduleWorker = promisifyAll(
    new PublishScheduledWorker(redisClient, false),
  );
  scheduleWorker.run();
  await delay(15000);

  const res2 = await scheduledMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res2.totalItems).toBe(0);

  const pendingMessages = await getQueuePendingMessages();
  const res3 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res3.totalItems).toBe(1);

  await delayHandler.quitAsync();
  await watchdogWorker.quitAsync();
  await scheduleWorker.quitAsync();
});
