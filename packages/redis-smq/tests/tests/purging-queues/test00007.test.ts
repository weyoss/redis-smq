/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { ICallback, IRedisClient } from 'redis-smq-common';
import { processingQueue } from '../../../src/lib/consumer/message-handler/processing-queue/processing-queue.js';
import { IQueueParams } from '../../../src/lib/index.js';
import { getConsumer } from '../../common/consumer.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { getQueue } from '../../common/queue.js';

test('Concurrently deleting a message queue and starting a consumer', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, false);
  const consumer = getConsumer();

  // queueInstance.delete() calls processingQueue.getQueueProcessingQueues() after validation is passed.
  // Within getQueueProcessingQueues() method, we can take more time than usual to return a response, to allow the
  // consumer to start up. queueManagerInstance.delete() should detect that a consumer has been started and
  // the operation should be cancelled.
  const originalMethod = processingQueue.getQueueProcessingQueues;
  processingQueue.getQueueProcessingQueues = (
    ...args: [
      redisClient: IRedisClient,
      queue: IQueueParams,
      cb: ICallback<Record<string, string>>,
    ]
  ): void => {
    setTimeout(() => {
      originalMethod(...args);
    }, 5000);
  };

  const q = await getQueue();

  const { WatchedKeysChangedError } = await import('redis-smq-common');
  await expect(
    Promise.all([q.deleteAsync(getDefaultQueue()), consumer.runAsync()]),
  ).rejects.toThrow(WatchedKeysChangedError);

  // restore
  processingQueue.getQueueProcessingQueues = originalMethod;
});
