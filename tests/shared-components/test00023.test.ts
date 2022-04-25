import { promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { LockManager } from '../../src/system/common/lock-manager/lock-manager';

test('LockManager: retryOnFail', async () => {
  const redisClient = await getRedisInstance();
  const lockManager = promisifyAll(
    new LockManager(redisClient, 'key1', 20000, false),
  );

  const r = await lockManager.acquireLockAsync();
  expect(r).toBe(true);

  const lockManager2 = promisifyAll(
    new LockManager(redisClient, 'key1', 10000, false),
  );

  const r1 = await lockManager2.acquireLockAsync();
  expect(r1).toBe(false);

  const lockManager3 = promisifyAll(
    new LockManager(redisClient, 'key1', 10000, true),
  );

  const r3 = await lockManager3.acquireLockAsync();
  expect(r3).toBe(true);

  const r4 = await lockManager3.extendLockAsync();
  expect(r4).toBe(true);
});
