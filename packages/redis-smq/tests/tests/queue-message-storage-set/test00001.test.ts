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
import { QueueMessagesStorageSet } from '../../../src/lib/queue-messages/queue-messages-storage/queue-messages-storage-set.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';

const { promisifyAll } = bluebird;

it('QueueMessagesStorageSet: should return empty array for an empty list', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const redisClient = promisifyAll(new RedisClient());
  const queueMessagesStorageSet = promisifyAll(
    new QueueMessagesStorageSet(redisClient),
  );
  const { keyQueueMessages } = redisKeys.getQueueKeys(defaultQueue, null);
  const items = await queueMessagesStorageSet.fetchItemsAsync(
    keyQueueMessages,
    {
      page: 1,
      pageSize: 5,
    },
  );
  expect(items.length).toBe(0);
  await redisClient.shutdownAsync();
});
