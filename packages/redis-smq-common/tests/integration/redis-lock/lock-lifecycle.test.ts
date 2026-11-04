/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import {
  ExtendLockError,
  NotLockedError,
  RedisLock,
} from '../../../src/redis-lock/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';
import { getRedisInstance } from '../../helpers/common.js';

const KEY = 'lifecycle-lock';

// `RedisLock` rejects construction with "Lock TTL is too small" below an
// internal minimum (proven lower bound: 5000ms — this is what the original
// tests used). Do NOT shrink this without checking `src/redis-lock`.
const TTL_MS = 5000;
/** Must exceed TTL_MS so the lock is guaranteed expired before the next step. */
const EXPIRE_WAIT_MS = 6000;

async function makeLock(ttl = TTL_MS) {
  const client = await getRedisInstance();
  return bluebird.promisifyAll(
    new RedisLock(client, getDummyLogger(), KEY, ttl, false),
  );
}

describe('RedisLock: lifecycle', () => {
  it('getId() returns a stable string identifier', async () => {
    const lock = await makeLock();
    const id = lock.getId();
    expect(typeof id).toBe('string');
    expect(id).toBe(lock.getId());
    await lock.acquireLockAsync();
    await lock.releaseLockAsync();
  });

  it('acquireLock() transitions isLocked() to true', async () => {
    const lock = await makeLock();
    expect(lock.isLocked()).toBe(false);
    await lock.acquireLockAsync();
    expect(lock.isLocked()).toBe(true);
    await lock.releaseLockAsync();
  });

  it('acquireLock() twice on the same instance is idempotent', async () => {
    const lock = await makeLock();
    await lock.acquireLockAsync();
    await lock.acquireLockAsync();
    expect(lock.isLocked()).toBe(true);
    await lock.releaseLockAsync();
  });

  it('extendLock() succeeds on a held lock', async () => {
    const lock = await makeLock();
    await lock.acquireLockAsync();
    await expect(lock.extendLockAsync()).resolves.toBeUndefined();
    await lock.releaseLockAsync();
  });

  it('releaseLock() transitions to released state', async () => {
    const lock = await makeLock();
    await lock.acquireLockAsync();
    await lock.releaseLockAsync();
    expect(lock.isLocked()).toBe(false);
    expect(lock.isReleased()).toBe(true);
  });

  it('releaseLock() twice is idempotent', async () => {
    const lock = await makeLock();
    await lock.acquireLockAsync();
    await lock.releaseLockAsync();
    await expect(lock.releaseLockAsync()).resolves.toBeUndefined();
    expect(lock.isReleased()).toBe(true);
  });

  it('extendLock() after release rejects with NotLockedError', async () => {
    const lock = await makeLock();
    await lock.acquireLockAsync();
    await lock.releaseLockAsync();
    await expect(lock.extendLockAsync()).rejects.toThrow(NotLockedError);
  });

  it('acquireLock() re-acquires after release', async () => {
    const lock = await makeLock();
    await lock.acquireLockAsync();
    await lock.releaseLockAsync();
    await expect(lock.acquireLockAsync()).resolves.toBeUndefined();
    expect(lock.isLocked()).toBe(true);
    await lock.releaseLockAsync();
  });

  describe('after TTL expiry', () => {
    it('extendLock() rejects with ExtendLockError', async () => {
      const lock = await makeLock();
      await lock.acquireLockAsync();
      await bluebird.delay(EXPIRE_WAIT_MS);
      await expect(lock.extendLockAsync()).rejects.toThrow(ExtendLockError);
    });

    it('acquireLock() re-acquires the lock with a fresh TTL', async () => {
      const lock = await makeLock();
      await lock.acquireLockAsync();
      await bluebird.delay(EXPIRE_WAIT_MS);
      await expect(lock.acquireLockAsync()).resolves.toBeUndefined();
      expect(lock.isLocked()).toBe(true);
      await lock.releaseLockAsync();
    });
  });

  describe('cleanup', () => {
    it('removes its redis error listener on shutdown', async () => {
      // Regression: the constructor registers `redisClient.on('error',
      // this.handleError)` but the original `goingDown` never removed it.
      // Every created-and-released `RedisLock` accumulated one permanent
      // listener on the shared client. In processes that cycle locks
      // (WorkerCluster creates them dynamically per group), listener
      // count grows without bound — Node warns at 10, throws at ~100.
      const client = await getRedisInstance();
      const before = client.listenerCount('error');

      const lock = bluebird.promisifyAll(
        new RedisLock(client, getDummyLogger(), 'leak-check', 5000, false),
      );

      // Constructor must have registered exactly one error listener
      // (assuming no other code path added one for this instance).
      expect(client.listenerCount('error')).toBe(before + 1);

      await lock.acquireLockAsync();
      // Listener survives acquisition.
      expect(client.listenerCount('error')).toBe(before + 1);

      await lock.releaseLockAsync();
      // Listener is removed during `goingDown`, so the client is back
      // to its pre-construction count.
      expect(client.listenerCount('error')).toBe(before);
    });
  });
});
