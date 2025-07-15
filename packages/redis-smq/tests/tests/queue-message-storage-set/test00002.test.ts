/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { expect, it } from 'vitest';
import { RedisClient } from '../../../src/common/redis-client/redis-client.js';
import { redisKeys } from '../../../src/common/redis-keys/redis-keys.js';
import { EQueueType } from '../../../src/index.js';
import { QueueStorageSet } from '../../../src/common/queue-explorer/queue-storage/queue-storage-set.js';
import {
  createQueue,
  getDefaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming.js';

const { promisifyAll } = bluebird;

it('QueueStorageSet: should return 0 for an empty list', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const redisClient = promisifyAll(new RedisClient());
  const queueMessagesStorageSet = promisifyAll(
    new QueueStorageSet(redisClient),
  );
  const { keyQueueMessages } = redisKeys.getQueueKeys(defaultQueue, null);
  const count = await queueMessagesStorageSet.countAsync(keyQueueMessages);
  expect(count).toBe(0);
  await redisClient.shutdownAsync();
});

it('should return the correct count after adding items', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const redisClient = promisifyAll(new RedisClient());
  const queueMessagesStorageSet = promisifyAll(
    new QueueStorageSet(redisClient),
  );
  await produceMessage(defaultQueue);
  const { keyQueueMessages } = redisKeys.getQueueKeys(defaultQueue, null);
  const count = await queueMessagesStorageSet.countAsync(keyQueueMessages);
  expect(count).toBe(1);
  await redisClient.shutdownAsync();
});
