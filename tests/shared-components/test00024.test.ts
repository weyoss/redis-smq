import { delay, promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { LockManager } from '../../src/system/common/lock-manager/lock-manager';

test('LockManager: autoExtend', async () => {
  const redisClient = await getRedisInstance();
  const lockManager = promisifyAll(
    new LockManager(redisClient, 'key1', 10000, false, true),
  );

  const r = await lockManager.acquireLockAsync();
  expect(r).toBe(true);

  await expect(lockManager.extendLockAsync()).rejects.toThrow(
    `Can not extend a lock when autoExtend is enabled`,
  );

  await delay(20000);

  const lockManager2 = promisifyAll(
    new LockManager(redisClient, 'key1', 10000, false),
  );

  const r2 = await lockManager2.acquireLockAsync();
  expect(r2).toBe(false);

  await lockManager.releaseLockAsync();
  await lockManager2.releaseLockAsync();
});
