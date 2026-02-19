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
import {
  RedisLock,
  AcquireLockNotAllowedError,
  AcquireLockError,
} from '../../src/redis-lock/index.js';
import { getRedisInstance } from '../common.js';
import { getDummyLogger } from '../../src/logger/index.js';

it('Locker: autoExtend', async () => {
  const redisClient = await getRedisInstance();
  const lock = bluebird.promisifyAll(
    new RedisLock(redisClient, getDummyLogger(), 'key1', 10000, false, 3000),
  );
  await lock.acquireLockAsync();
  await expect(lock.extendLockAsync()).rejects.toThrowError(
    AcquireLockNotAllowedError,
  );

  await bluebird.delay(20000);

  const lock2 = bluebird.promisifyAll(
    new RedisLock(redisClient, getDummyLogger(), 'key1', 10000, false),
  );
  await expect(lock2.acquireLockAsync()).rejects.toThrow(AcquireLockError);

  await lock.releaseLockAsync();
  await lock2.releaseLockAsync();
});
