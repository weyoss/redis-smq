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
  LockExtendError,
  LockNotAcquiredError,
} from '../../src/redis-lock/index.js';
import { RedisLock } from '../../src/redis-lock/index.js';
import { getRedisInstance } from '../common.js';

it('Locker: locker(), extend(), releaseLock()', async () => {
  const redisClient = await getRedisInstance();
  const lock = bluebird.promisifyAll(
    new RedisLock(redisClient, console, 'key1', 5000, false),
  );
  expect(lock.getId()).toBeDefined();
  await expect(lock.acquireLockAsync()).resolves.toBe(true);
  expect(lock.isLocked()).toBe(true);
  await expect(lock.acquireLockAsync()).resolves.toBe(false);
  expect(lock.isLocked()).toBe(true);

  await bluebird.delay(10000);

  await expect(lock.extendLockAsync()).rejects.toThrow(LockExtendError);
  await expect(lock.acquireLockAsync()).resolves.toBe(true);
  await lock.extendLockAsync();
  await lock.releaseLockAsync();
  expect(lock.isLocked()).toBe(false);
  expect(lock.isReleased()).toBe(true);
  await lock.releaseLockAsync();
  expect(lock.isReleased()).toBe(true);
  await expect(lock.extendLockAsync()).rejects.toThrow(LockNotAcquiredError);
  await expect(lock.acquireLockAsync()).resolves.toBe(true);
  await lock.releaseLockAsync();
});
