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
import { AbortError } from '../../src/errors/index.js';
import { RedisLock } from '../../src/redis-lock/index.js';
import { getMockedRedisClient } from './common.js';
import { getDummyLogger } from '../../src/logger/index.js';

it('Locker: extendLock() -> LockAbortError', async () => {
  const redisClient = getMockedRedisClient();
  const lock = bluebird.promisifyAll(
    new RedisLock(redisClient, getDummyLogger(), 'key1', 10000, false),
  );
  await expect(lock.acquireLockAsync()).resolves.toBe(true);
  await expect(
    Promise.all([lock.extendLockAsync(), lock.shutdownAsync()]),
  ).rejects.toThrow(AbortError);
});
