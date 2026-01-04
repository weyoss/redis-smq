/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test, vitest } from 'vitest';
import bluebird from 'bluebird';
import {
  EMessagePropertyStatus,
  MessageManager,
  ProducibleMessage,
} from '../../../src/index.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getConsumer } from '../../common/consumer.js';
import { untilConsumerDown } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { RequeueImmediateWorker } from '../../../src/consumer/message-handler/workers/requeue-immediate.worker.js';

test('An unacked message without retryDelay should be moved to queueRequeued. RequeueImmediateWorker should move the message from queueRequeued to queuePending.', async () => {
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
      .setRetryDelay(0)
      .setBody('message body')
      .setQueue(getDefaultQueue()),
  );

  consumer.run(() => void 0);
  await untilConsumerDown(consumer);
  await shutDownBaseInstance(consumer);

  const message = bluebird.promisifyAll(new MessageManager());
  const msg = await message.getMessageByIdAsync(messageId);

  expect(msg.status === EMessagePropertyStatus.UNACK_REQUEUING).toBe(true);

  const queueParsedParams = { queueParams: defaultQueue, groupId: null };

  // should move from requeue queue to delay queue
  const requeueImmediateWorker = bluebird.promisifyAll(
    new RequeueImmediateWorker(queueParsedParams, { namespaces: [] }),
  );
  await requeueImmediateWorker.runAsync();
  await bluebird.delay(5000);

  const msg2 = await message.getMessageByIdAsync(messageId);
  expect(msg2.status === EMessagePropertyStatus.PENDING).toBe(true);

  const pendingMessages = await getQueuePendingMessages();
  const res = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res.totalItems).toBe(1);

  await requeueImmediateWorker.shutdownAsync();
});
