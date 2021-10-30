import { promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { LockManager } from '../../src/system/common/lock-manager';

describe('LockManager', () => {
  test('Case 1', async () => {
    const redisClient = await getRedisInstance();
    const lockManager1 = promisifyAll(
      new LockManager(redisClient, 'key1', 5000, false),
    );
    const lock1 = await lockManager1.acquireLockAsync();
    expect(lock1).toBe(true);
  });
});
