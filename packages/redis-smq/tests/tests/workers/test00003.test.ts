/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import bluebird from 'bluebird';
import {
  EMessagePropertyStatus,
  QueuePublishedMessages,
} from '../../../src/index.js';
import { RequeueImmediateWorker } from '../../../src/consumer/message-handler/queue-workers/workers/requeue-immediate.worker.js';
import { ReapConsumersWorker } from '../../../src/consumer/message-handler/queue-workers/workers/reap-consumers.worker.js';
import {
  crashAConsumerConsumingAMessage,
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getQueuePendingMessages } from '../../common/queue-pending-messages.js';
import { config, redisConfig } from '../../common/config.js';
import { randomUUID } from 'node:crypto';

test('ReapConsumersWorker', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  await crashAConsumerConsumingAMessage();

  const queueMessages = bluebird.promisifyAll(new QueuePublishedMessages());
  const messages = await queueMessages.getMessages(defaultQueue, 0, 100);
  expect(messages.totalItems).toBe(1);
  const [message] = messages.items;

  expect(message.status === EMessagePropertyStatus.PROCESSING).toBe(true);

  const queueParsedParams = { queueParams: defaultQueue, groupId: null };

  const reapConsumerWorker = bluebird.promisifyAll(
    new ReapConsumersWorker({
      config,
      redisConfig,
      queueParsedParams,
      loggerContext: { namespaces: ['workers-test00003'] },
      consumerId: randomUUID(),
    }),
  );
  await reapConsumerWorker.run();

  const requeueWorker = bluebird.promisifyAll(
    new RequeueImmediateWorker({
      config,
      redisConfig,
      queueParsedParams,
      loggerContext: { namespaces: [] },
      consumerId: randomUUID(),
    }),
  );
  await requeueWorker.run();
  await bluebird.delay(20000);

  const pendingMessages = await getQueuePendingMessages();
  const res3 = await pendingMessages.getMessages(defaultQueue, 0, 100);
  expect(res3.totalItems).toBe(1);

  await requeueWorker.shutdown();
  await reapConsumerWorker.shutdown();
});
