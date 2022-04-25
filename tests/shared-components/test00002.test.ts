import { delay, promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { LockManager } from '../../src/system/common/lock-manager/lock-manager';

test('LockManager: acquireLock(), extendLock(), releaseLock()', async () => {
  const redisClient = await getRedisInstance();
  const lockManager = promisifyAll(
    new LockManager(redisClient, 'key1', 5000, false),
  );

  const r = await lockManager.acquireLockAsync();
  expect(r).toBe(true);

  await expect(lockManager.acquireLockAsync()).rejects.toThrow(
    `The lock is currently not released or a pending operation is in progress`,
  );

  await delay(10000);
  const r1 = await lockManager.extendLockAsync();
  expect(r1).toBe(false);

  const r2 = await lockManager.acquireLockAsync();
  expect(r2).toBe(true);

  const r3 = await lockManager.extendLockAsync();
  expect(r3).toBe(true);

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

  const r4 = await lockManager.acquireLockAsync();
  expect(r4).toBe(true);
});
