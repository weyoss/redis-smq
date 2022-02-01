import { promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { LockManager } from '../../src/system/common/lock-manager/lock-manager';

describe('LockManager', () => {
  test('Case 1', async () => {
    const redisClient = await getRedisInstance();
    const lockManager1 = promisifyAll(
      new LockManager(redisClient, 'key1', 30000, false),
    );
    const lock1 = await lockManager1.acquireLockAsync();
    expect(lock1).toBe(true);

    const redisClient2 = await getRedisInstance();
    const lockManager2 = promisifyAll(
      new LockManager(redisClient2, 'key1', 30000, false),
    );
    const lock2 = await lockManager2.acquireLockAsync();
    expect(lock2).toBe(false);

    const redisClient3 = await getRedisInstance();
    const lockManager3 = promisifyAll(
      new LockManager(redisClient3, 'key1', 30000, true),
    );
    const lock3 = await lockManager3.acquireLockAsync();
    expect(lock3).toBe(true);

    const extended = await lockManager3.acquireLockAsync();
    expect(extended).toBe(true);

    await expect(async () => {
      await lockManager1.acquireLockAsync();
    }).rejects.toThrow(`Could not extend the acquired lock with ID`);

    await lockManager3.releaseLockAsync();
    await lockManager3.quitAsync();
    await lockManager3.quitAsync();

    await expect(async () => {
      await lockManager3.releaseLockAsync();
    }).rejects.toThrow(
      `Instance is no longer usable after calling quit(). Create a new instance.`,
    );

    await expect(async () => {
      await lockManager3.acquireLockAsync();
    }).rejects.toThrow(
      `Instance is no longer usable after calling quit(). Create a new instance.`,
    );
  });
});
