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
import { BrowserStorageSet } from '../../../src/queue-messages/message-browser/browser-storage/browser-storage-set.js';
import { getRedisInstance } from '../../common/redis.js';

const { promisifyAll } = bluebird;

it('QueueStorageSet: should fetch all items for a small list', async () => {
  const queueMessagesStorageSet = promisifyAll(new BrowserStorageSet());
  const redisClient = await getRedisInstance();
  const key = 'my-key';

  const ids: string[] = [];
  for (let i = 0; i < 5; i++) {
    const item = `a${i}`;
    await redisClient.saddAsync(key, item);
    ids.push(item);
  }

  const items = await queueMessagesStorageSet.fetchAllItemsAsync(key);
  expect(items.sort()).toEqual(ids.sort());
});
