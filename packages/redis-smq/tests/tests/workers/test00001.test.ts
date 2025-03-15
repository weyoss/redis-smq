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
import { Configuration } from '../../../src/config/index.js';
import DelayUnacknowledgedWorker from '../../../src/lib/consumer/workers/delay-unacknowledged.worker.js';
import PublishScheduledWorker from '../../../src/lib/consumer/workers/publish-scheduled.worker.js';
import WatchConsumersWorker from '../../../src/lib/consumer/workers/watch-consumers.worker.js';
import {
  IMessageParams,
  IMessageTransferable,
  ProducibleMessage,
} from '../../../src/lib/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getConsumer } from '../../common/consumer.js';
import { untilConsumerDown } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { getQueueScheduledMessages } from '../../common/queue-scheduled-messages.js';

test('WatchdogWorker -> DelayUnacknowledgedWorker -> PublishScheduledWorker', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  let message: IMessageParams | null = null;
  const consumer = getConsumer({
    messageHandler: vitest.fn((msg: IMessageTransferable) => {
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
      .setQueue(getDefaultQueue()),
  );

  consumer.run(() => void 0);
  await untilConsumerDown(consumer);
  await shutDownBaseInstance(consumer);
  expect(message !== null).toBe(true);

  const workerArgs = {
    queueParsedParams: { queueParams: defaultQueue, groupId: null },
    config: Configuration.getSetConfig(),
  };

  // should move message from processing queue to delay queue
  const watchdogWorker = bluebird.promisifyAll(
    WatchConsumersWorker(workerArgs),
  );
  await watchdogWorker.runAsync();
  await bluebird.delay(5000);

  // should move from delay queue to scheduled queue
  const delayHandler = bluebird.promisifyAll(
    DelayUnacknowledgedWorker(workerArgs),
  );
  await delayHandler.runAsync();
  await bluebird.delay(5000);

  const scheduledMessages = await getQueueScheduledMessages();
  const res = await scheduledMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res.totalItems).toBe(1);

  // should move from delay queue to scheduled queue
  const scheduleWorker = bluebird.promisifyAll(
    PublishScheduledWorker(workerArgs),
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
