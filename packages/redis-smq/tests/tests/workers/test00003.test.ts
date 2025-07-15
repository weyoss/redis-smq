/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import {
  Configuration,
  EMessagePropertyStatus,
  QueueMessages,
} from '../../../src/index.js';
import RequeueImmediateWorker from '../../../src/consumer/workers/requeue-immediate.worker.js';
import ReapConsumersWorker from '../../../src/consumer/workers/reap-consumers.worker.js';
import {
  crashAConsumerConsumingAMessage,
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';

test('ReapConsumersWorker', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  await crashAConsumerConsumingAMessage();

  const queueMessages = bluebird.promisifyAll(new QueueMessages());
  const messages = await queueMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(messages.totalItems).toBe(1);
  const [message] = messages.items;

  expect(message.status === EMessagePropertyStatus.PROCESSING).toBe(true);

  const workerArgs = {
    queueParsedParams: { queueParams: defaultQueue, groupId: null },
    config: Configuration.getSetConfig(),
  };

  const reapConsumerWorker = bluebird.promisifyAll(
    ReapConsumersWorker(workerArgs),
  );
  await reapConsumerWorker.runAsync();

  const requeueWorker = bluebird.promisifyAll(
    RequeueImmediateWorker(workerArgs),
  );
  await requeueWorker.runAsync();
  await bluebird.delay(20000);

  const pendingMessages = await getQueuePendingMessages();
  const res3 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res3.totalItems).toBe(1);

  await requeueWorker.shutdownAsync();
  await reapConsumerWorker.shutdownAsync();
});
