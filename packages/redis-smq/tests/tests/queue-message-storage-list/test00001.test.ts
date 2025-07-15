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
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { QueueStorageList } from '../../../src/common/queue-explorer/queue-storage/queue-storage-list.js';

const { promisifyAll } = bluebird;

it('QueueStorageList: should return empty array for an empty list', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const redisClient = promisifyAll(new RedisClient());
  const queueMessagesStorageList = promisifyAll(
    new QueueStorageList(redisClient),
  );
  const { keyQueuePending } = redisKeys.getQueueKeys(defaultQueue, null);
  const items = await queueMessagesStorageList.fetchItemsAsync(
    keyQueuePending,
    {
      offsetStart: 0,
      offsetEnd: 99,
    },
  );
  expect(items.length).toBe(0);
  await redisClient.shutdownAsync();
});
