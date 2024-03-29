/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect, jest } from '@jest/globals';
import bluebird from 'bluebird';
import { Configuration } from '../../../src/config/index.js';
import {
  IMessageParams,
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import DelayUnacknowledgedWorker from '../../../src/lib/consumer/workers/delay-unacknowledged.worker.js';
import PublishScheduledWorker from '../../../src/lib/consumer/workers/publish-scheduled.worker.js';
import WatchConsumersWorker from '../../../src/lib/consumer/workers/watch-consumers.worker.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getConsumer } from '../../common/consumer.js';
import { untilConsumerDown } from '../../common/events.js';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { getQueueScheduledMessages } from '../../common/queue-scheduled-messages.js';

test('WatchdogWorker -> DelayUnacknowledgedWorker -> PublishScheduledWorker', async () => {
  await createQueue(defaultQueue, false);

  let message: IMessageParams | null = null;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg: IMessageTransferable) => {
      message = msg;
      setTimeout(() => consumer.shutdown(() => void 0), 5000);
    }),
  });

  const producer = getProducer();
  await producer.runAsync();
  await producer.produceAsync(
    new ProducibleMessage()
      .setRetryDelay(10000)
      .setBody('message body')
      .setQueue(defaultQueue),
  );

  consumer.run(() => void 0);
  await untilConsumerDown(consumer);
  await shutDownBaseInstance(consumer);
  expect(message !== null).toBe(true);

  // should move message from processing queue to delay queue
  const watchdogWorker = await bluebird.promisifyAll(
    WatchConsumersWorker(Configuration.getSetConfig()),
  );
  await watchdogWorker.runAsync();
  await bluebird.delay(5000);

  // should move from delay queue to scheduled queue
  const delayHandler = await bluebird.promisifyAll(
    DelayUnacknowledgedWorker(Configuration.getSetConfig()),
  );
  await delayHandler.runAsync();
  await bluebird.delay(5000);

  const scheduledMessages = await getQueueScheduledMessages();
  const res = await scheduledMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res.totalItems).toBe(1);

  // should move from delay queue to scheduled queue
  const scheduleWorker = await bluebird.promisifyAll(
    PublishScheduledWorker(Configuration.getSetConfig()),
  );
  await scheduleWorker.runAsync();
  await bluebird.delay(15000);

  const res2 = await scheduledMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res2.totalItems).toBe(0);

  const pendingMessages = await getQueuePendingMessages();
  const res3 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res3.totalItems).toBe(1);

  await delayHandler.shutdownAsync();
  await watchdogWorker.shutdownAsync();
  await scheduleWorker.shutdownAsync();
});
