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
import { EQueueType } from '../../../src/lib/index.js';
import { QueueMessagesStorageSortedSet } from '../../../src/lib/queue-messages/queue-messages-storage/queue-messages-storage-sorted-set.js';

import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';

const { promisifyAll } = bluebird;

it('QueueMessagesStorageSortedSet: should return empty array for an empty list', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.PRIORITY_QUEUE);
  const redisClient = promisifyAll(new RedisClient());
  const queueMessagesStorageSortedSet = promisifyAll(
    new QueueMessagesStorageSortedSet(redisClient),
  );
  const { keyQueuePriorityPending } = redisKeys.getQueueKeys(
    defaultQueue,
    null,
  );
  const items = await queueMessagesStorageSortedSet.fetchAllItemsAsync(
    keyQueuePriorityPending,
  );
  expect(items.length).toBe(0);
  await redisClient.shutdownAsync();
});
