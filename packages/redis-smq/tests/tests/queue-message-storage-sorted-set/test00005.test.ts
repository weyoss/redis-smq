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
import { redisKeys } from '../../../src/common/redis/redis-keys/redis-keys.js';
import { EQueueType } from '../../../src/index.js';
import { BrowserStorageSortedSet } from '../../../src/common/message-browser/browser-storage/browser-storage-sorted-set.js';

import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';

const { promisifyAll } = bluebird;

it('QueueStorageSortedSet: should return empty array for an empty list', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.PRIORITY_QUEUE);
  const queueMessagesStorageSortedSet = promisifyAll(
    new BrowserStorageSortedSet(),
  );
  const { keyQueuePriorityPending } = redisKeys.getQueueKeys(
    defaultQueue.ns,
    defaultQueue.name,
    null,
  );
  const items = await queueMessagesStorageSortedSet.fetchAllItemsAsync(
    keyQueuePriorityPending,
  );
  expect(items.length).toBe(0);
});
