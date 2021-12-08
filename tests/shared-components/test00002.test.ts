import { promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { LockManager } from '../../src/system/common/lock-manager/lock-manager';

describe('LockManager', () => {
  test('Case 1', async () => {
    const redisClient = await getRedisInstance();
    const lockManager1 = promisifyAll(
      new LockManager(redisClient, 'key1', 10000, false),
    );
    const lock1 = await lockManager1.acquireLockAsync();
    expect(lock1).toBe(true);

    const redisClient2 = await getRedisInstance();
    const lockManager2 = promisifyAll(
      new LockManager(redisClient2, 'key1', 10000, false),
    );
    const lock2 = await lockManager2.acquireLockAsync();
    expect(lock2).toBe(false);

    const redisClient3 = await getRedisInstance();
    const lockManager3 = promisifyAll(
      new LockManager(redisClient3, 'key1', 10000, true),
    );
    const lock3 = await lockManager3.acquireLockAsync();
    expect(lock3).toBe(true);
  });
});
