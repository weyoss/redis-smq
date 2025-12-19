/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { expect, it } from 'vitest';
import { redisKeys } from '../../../src/common/redis/redis-keys/redis-keys.js';
import { EQueueType } from '../../../src/index.js';
import {
  createQueue,
  getDefaultQueue,
} from '../../common/message-producing-consuming.js';
import { BrowserStorageList } from '../../../src/common/message-browser/browser-storage/browser-storage-list.js';

const { promisifyAll } = bluebird;

it('QueueStorageList: should return empty array for an empty list', async () => {
  const defaultQueue = getDefaultQueue();
  await createQueue(defaultQueue, EQueueType.FIFO_QUEUE);
  const queueMessagesStorageList = promisifyAll(new BrowserStorageList());
  const { keyQueuePending } = redisKeys.getQueueKeys(
    defaultQueue.ns,
    defaultQueue.name,
    null,
  );
  const items = await queueMessagesStorageList.fetchItemsAsync(
    keyQueuePending,
    {
      offsetStart: 0,
      offsetEnd: 99,
    },
  );
  expect(items.length).toBe(0);
});
