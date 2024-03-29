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
import RequeueUnacknowledgedWorker from '../../../src/lib/consumer/workers/requeue-unacknowledged.worker.js';
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

test('WatchdogWorker -> RequeueUnacknowledgedWorker', async () => {
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
      .setRetryDelay(0)
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
  const requeueWorker = await bluebird.promisifyAll(
    RequeueUnacknowledgedWorker(Configuration.getSetConfig()),
  );
  await requeueWorker.runAsync();
  await bluebird.delay(5000);

  const pendingMessages = await getQueuePendingMessages();
  const res3 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res3.totalItems).toBe(1);

  await requeueWorker.shutdownAsync();
  await watchdogWorker.shutdownAsync();
});
