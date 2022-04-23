import { delay, promisifyAll } from 'bluebird';
import { getRedisInstance } from '../common';
import { LockManager } from '../../src/system/common/lock-manager/lock-manager';
import { ICallback } from '../../types';

// Making extend() and lock() methods public so we can spy on them
class TestLockManager extends LockManager {
  public override extend(cb: ICallback<boolean>) {
    super.extend(cb);
  }
  public override lock(cb: ICallback<boolean>) {
    super.lock(cb);
  }
}

test('LockManager:  Do not throw an exception and try to acquire again an expired lock ', async () => {
  const redisClient = await getRedisInstance();
  const lockManager = promisifyAll(
    new TestLockManager(redisClient, 'key1', 10000, false),
  );

  const r1 = await lockManager.acquireLockAsync();
  expect(r1).toBe(true);

  const mockExtend: jest.SpyInstance<void, [cb: ICallback<boolean>]> =
    jest.spyOn(lockManager, 'extend');

  const mockLock: jest.SpyInstance<void, [cb: ICallback<boolean>]> = jest.spyOn(
    lockManager,
    'lock',
  );

  await delay(15000);
  const r2 = await lockManager.acquireLockAsync();
  expect(r2).toBe(true);

  expect(mockExtend).toHaveBeenCalledTimes(1);
  expect(mockLock).toHaveBeenCalledTimes(1);
});
