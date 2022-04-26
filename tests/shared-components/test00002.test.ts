import { delay, promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { LockManager } from '../../src/system/common/lock-manager/lock-manager';

test('LockManager: acquireLock(), extendLock(), releaseLock()', async () => {
  const redisClient = await getRedisInstance();
  const lockManager = promisifyAll(
    new LockManager(redisClient, 'key1', 5000, false),
  );

  await lockManager.acquireLockAsync();

  await expect(lockManager.acquireLockAsync()).rejects.toThrow(
    `The lock is currently not released or a pending operation is in progress`,
  );

  await delay(10000);
  await expect(lockManager.extendLockAsync()).rejects.toThrow(
    'Acquired lock could not be extended',
  );

  await lockManager.acquireLockAsync();

  await lockManager.extendLockAsync();

  await expect(
    Promise.all([
      lockManager.releaseLockAsync(),
      lockManager.releaseLockAsync(),
    ]),
  ).rejects.toThrow('A pending releaseLock() call is in progress');

  await delay(5000);
  await lockManager.releaseLockAsync();
  await lockManager.releaseLockAsync();

  await expect(lockManager.extendLockAsync()).rejects.toThrow(
    `The lock is currently not acquired or a pending operation is in progress`,
  );

  await lockManager.acquireLockAsync();
});
