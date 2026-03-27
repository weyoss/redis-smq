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
  IMessageTransferable,
  MessageManager,
  ProducibleMessage,
} from '../../../src/index.js';
import { RequeueDelayedWorker } from '../../../src/consumer/message-handler/queue-workers/workers/requeue-delayed.worker.js';
import { shutDownBaseInstance } from '../../common/base-instance.js';
import { getConsumer } from '../../common/consumer.js';
import { untilConsumerDown } from '../../common/events.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getProducer } from '../../common/producer.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { RequeueImmediateWorker } from '../../../src/consumer/message-handler/queue-workers/workers/requeue-immediate.worker.js';
import { config } from '../../common/config.js';
import { randomUUID } from 'node:crypto';
import { ICallback } from 'redis-smq-common';

test('An unacked message with retryDelay should be moved to queueRequeued. RequeueImmediateWorker should move the message from queueRequeued to queueDelayed. RequeueDelayedWorker should move the message from queueDelayed to queuePending.', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);

  const consumer = getConsumer({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    messageHandler: vitest.fn((msg: IMessageTransferable, cb: ICallback) => {
      setTimeout(() => consumer.shutdown(() => void 0), 5000);
    }),
  });

  const producer = getProducer();
  await producer.run();
  const [messageId] = await producer.produce(
    new ProducibleMessage()
      .setRetryDelay(10000)
      .setBody('message body')
      .setQueue(getDefaultQueue()),
  );

  consumer.run(() => void 0);
  await untilConsumerDown(consumer);
  await shutDownBaseInstance(consumer);

  const message = new MessageManager();
  const msg = await message.getMessageById(messageId);

  expect(msg.status === EMessagePropertyStatus.UNACK_REQUEUING).toBe(true);

  // should move from requeue queue to delay queue
  const requeueImmediateWorker = bluebird.promisifyAll(
    new RequeueImmediateWorker({
      config,
      queueParsedParams: {
        queueParams: defaultQueue,
        groupId: null,
      },
      loggerContext: {
        namespaces: [],
      },
      consumerId: randomUUID(),
    }),
  );
  await requeueImmediateWorker.run();
  await bluebird.delay(5000);

  const msg2 = await message.getMessageById(messageId);
  expect(msg2.status === EMessagePropertyStatus.UNACK_DELAYING).toBe(true);

  // should move from requeue queue to delay queue
  const requeueDelayedWorker = bluebird.promisifyAll(
    new RequeueDelayedWorker({
      queueParsedParams: {
        queueParams: defaultQueue,
        groupId: null,
      },
      loggerContext: {
        namespaces: [],
      },
      config,
      consumerId: randomUUID(),
    }),
  );
  await requeueDelayedWorker.run();
  await bluebird.delay(10000);

  const msg3 = await message.getMessageById(messageId);
  expect(msg3.status === EMessagePropertyStatus.PENDING).toBe(true);

  const pendingMessages = await getQueuePendingMessages();
  const res = await pendingMessages.getMessages(defaultQueue, 0, 100);
  expect(res.totalItems).toBe(1);

  await requeueDelayedWorker.shutdown();
  await requeueImmediateWorker.shutdown();
});
