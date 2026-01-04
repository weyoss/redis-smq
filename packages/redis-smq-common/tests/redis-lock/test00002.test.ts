/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, it } from 'vitest';
import bluebird from 'bluebird';
import { RedisLock } from '../../src/redis-lock/index.js';
import { getRedisInstance } from '../common.js';
import { getDummyLogger } from '../../src/logger/index.js';

it('Locker: retryOnFail', async () => {
  const redisClient = await getRedisInstance();
  const lock = bluebird.promisifyAll(
    new RedisLock(redisClient, getDummyLogger(), 'key1', 20000, false),
  );
  await expect(lock.acquireLockAsync()).resolves.toBe(true);

  const lock2 = bluebird.promisifyAll(
    new RedisLock(redisClient, getDummyLogger(), 'key1', 10000, false),
  );
  await expect(lock2.acquireLockAsync()).resolves.toBe(false);

  const lock3 = bluebird.promisifyAll(
    new RedisLock(redisClient, getDummyLogger(), 'key1', 10000, true),
  );
  await expect(lock3.acquireLockAsync()).resolves.toBe(true);
  await expect(lock3.extendLockAsync()).resolves.toBeUndefined();
});
