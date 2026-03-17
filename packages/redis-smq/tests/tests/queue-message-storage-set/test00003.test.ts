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

it('QueueStorageSet: should fetch all items for a large list (chunking test)', async () => {
  const redisClient = await getRedisInstance();
  const key = 'my-key';
  await redisClient.saddAsync(key, 'a');
  await redisClient.saddAsync(key, 'b');

  const storageSet = promisifyAll(new BrowserStorageSet());
  const items = await storageSet.fetchAllItemsAsync(key);
  expect(items.sort()).toEqual(['a', 'b']);
});
