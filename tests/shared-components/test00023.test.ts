import { promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { LockManager } from '../../src/common/lock-manager/lock-manager';

test('LockManager: retryOnFail', async () => {
  const redisClient = await getRedisInstance();
  const lockManager = promisifyAll(
    new LockManager(redisClient, 'key1', 20000, false),
  );

  await lockManager.acquireLockAsync();

  const lockManager2 = promisifyAll(
    new LockManager(redisClient, 'key1', 10000, false),
  );

  await expect(lockManager2.acquireLockAsync()).rejects.toThrow(
    `Could not acquire a lock`,
  );

  const lockManager3 = promisifyAll(
    new LockManager(redisClient, 'key1', 10000, true),
  );

  await lockManager3.acquireLockAsync();

  await lockManager3.extendLockAsync();
});
