/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test, vitest } from 'vitest';
import bluebird from 'bluebird';
import {
  Configuration,
  EMessagePropertyStatus,
  Message,
  ProducibleMessage,
} from '../../../src/index.js';
import RequeueDelayedWorker from '../../../src/consumer/workers/requeue-delayed.worker.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getConsumer } from '../../common/consumer.js';
import { untilConsumerDown } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import RequeueImmediateWorker from '../../../src/consumer/workers/requeue-immediate.worker.js';

test('An unacked message with retryDelay should be moved to queueRequeued. RequeueImmediateWorker should move the message from queueRequeued to queueDelayed. RequeueDelayedWorker should move the message from queueDelayed to queuePending.', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const consumer = getConsumer({
    messageHandler: vitest.fn(() => {
      setTimeout(() => consumer.shutdown(() => void 0), 5000);
    }),
  });

  const producer = getProducer();
  await producer.runAsync();
  const [messageId] = await producer.produceAsync(
    new ProducibleMessage()
      .setRetryDelay(10000)
      .setBody('message body')
      .setQueue(getDefaultQueue()),
  );

  consumer.run(() => void 0);
  await untilConsumerDown(consumer);
  await shutDownBaseInstance(consumer);

  const message = bluebird.promisifyAll(new Message());
  const msg = await message.getMessageByIdAsync(messageId);

  expect(msg.status === EMessagePropertyStatus.UNACK_REQUEUING).toBe(true);

  const workerArgs = {
    queueParsedParams: { queueParams: defaultQueue, groupId: null },
    config: Configuration.getSetConfig(),
  };

  // should move from requeue queue to delay queue
  const requeueImmediateWorker = bluebird.promisifyAll(
    RequeueImmediateWorker(workerArgs),
  );
  await requeueImmediateWorker.runAsync();
  await bluebird.delay(5000);

  const msg2 = await message.getMessageByIdAsync(messageId);
  expect(msg2.status === EMessagePropertyStatus.UNACK_DELAYING).toBe(true);

  // should move from requeue queue to delay queue
  const requeueDelayedWorker = bluebird.promisifyAll(
    RequeueDelayedWorker(workerArgs),
  );
  await requeueDelayedWorker.runAsync();
  await bluebird.delay(10000);

  const msg3 = await message.getMessageByIdAsync(messageId);
  expect(msg3.status === EMessagePropertyStatus.PENDING).toBe(true);

  const pendingMessages = await getQueuePendingMessages();
  const res = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res.totalItems).toBe(1);

  await requeueDelayedWorker.shutdownAsync();
  await requeueImmediateWorker.shutdownAsync();
});
