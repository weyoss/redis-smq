import { promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { LockManager } from '../../src/system/common/lock-manager/lock-manager';

describe('LockManager', () => {
  test('Case 1', async () => {
    const redisClient = await getRedisInstance();
    const lockManager1 = promisifyAll(
      new LockManager(redisClient, 'key1', 30000, false),
    );
    const r1 = await lockManager1.acquireLockAsync();
    expect(r1).toBe(true);

    const redisClient2 = await getRedisInstance();
    const lockManager2 = promisifyAll(
      new LockManager(redisClient2, 'key1', 30000, false),
    );
    const r2 = await lockManager2.acquireLockAsync();
    expect(r2).toBe(false);

    const redisClient3 = await getRedisInstance();
    const lockManager3 = promisifyAll(
      new LockManager(redisClient3, 'key1', 30000, true),
    );
    const r3 = await lockManager3.acquireLockAsync();
    expect(r3).toBe(true);

    const extended = await lockManager3.acquireLockAsync();
    expect(extended).toBe(true);

    const r4 = await lockManager1.acquireLockAsync();
    expect(r4).toBe(false);

    await lockManager3.releaseLockAsync();
    await lockManager3.releaseLockAsync();

    await expect(
      Promise.all([
        lockManager3.acquireLockAsync(),
        lockManager3.acquireLockAsync(),
      ]),
    ).rejects.toThrow(
      `Can not acquire lock while a acquireLock() or releaseLock() call is pending`,
    );

    const r5 = await lockManager3.acquireLockAsync();
    expect(r5).toBe(true);

    await expect(
      Promise.all([
        lockManager3.releaseLockAsync(),
        lockManager3.releaseLockAsync(),
      ]),
    ).rejects.toThrow(`releaseLock() has been already called`);
  });
});
