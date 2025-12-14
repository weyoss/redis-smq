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
  produceMessageWithPriority,
} from '../../common/message-producing-consuming.js';

const { promisifyAll } = bluebird;

it('QueueStorageSortedSet: should return 0 for an empty list', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.PRIORITY_QUEUE);
  const queueMessagesStorageSortedSet = promisifyAll(
    new BrowserStorageSortedSet(),
  );

  const { keyQueuePriorityPending } = redisKeys.getQueueKeys(
    defaultQueue,
    null,
  );
  const count = await queueMessagesStorageSortedSet.countAsync(
    keyQueuePriorityPending,
  );
  expect(count).toBe(0);
});

it('should return the correct count after adding items', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.PRIORITY_QUEUE);
  const queueMessagesStorageSortedSet = promisifyAll(
    new BrowserStorageSortedSet(),
  );
  await produceMessageWithPriority(defaultQueue);
  const { keyQueuePriorityPending } = redisKeys.getQueueKeys(
    defaultQueue,
    null,
  );
  const count = await queueMessagesStorageSortedSet.countAsync(
    keyQueuePriorityPending,
  );
  expect(count).toBe(1);
});
