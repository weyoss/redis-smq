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

it('QueueStorageSet: should fetch items with correct pagination', async () => {
  const queueMessagesStorageSet = promisifyAll(new BrowserStorageSet());
  const redisClient = await getRedisInstance();
  const key = 'my-key';

  const ids: string[] = [];
  for (let i = 0; i < 500; i++) {
    const item = `a${i}`;
    await redisClient.saddAsync(key, item);
    ids.push(item);
  }

  const allPages = new Set<string>();
  for (let i = 0; i < 17; i++) {
    const p = await queueMessagesStorageSet.fetchItemsAsync(key, {
      page: i + 1,
      pageSize: 30,
    });
    p.map((i) => allPages.add(i));
  }

  // Test out of bounds
  const outOfBounds = await queueMessagesStorageSet.fetchItemsAsync(key, {
    page: 18,
    pageSize: 30,
  });
  expect(outOfBounds).toEqual([]);

  expect([...allPages.values()].sort()).toEqual(ids.sort());
});
