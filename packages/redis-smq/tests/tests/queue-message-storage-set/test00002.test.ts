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

it('QueueStorageSet: should return 0 for an empty list', async () => {
  const storageSet = promisifyAll(new BrowserStorageSet());
  const count = await storageSet.countAsync('my-key');
  expect(count).toBe(0);
});

it('should return the correct count after adding items', async () => {
  const redisClient = await getRedisInstance();
  const key = 'my-key';
  await redisClient.saddAsync(key, 'a');
  await redisClient.saddAsync(key, 'b');

  const queueMessagesStorageSet = promisifyAll(new BrowserStorageSet());
  const count = await queueMessagesStorageSet.countAsync(key);
  expect(count).toBe(2);
});
