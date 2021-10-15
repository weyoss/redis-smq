import { ICallback } from '../../types';
import { RedisClient } from './redis-client';
import * as Redlock from 'redlock';

export class LockManager {
  protected redisClient: RedisClient | null = null;
  protected redlock: Redlock | null = null;
  protected acquiredLock: Redlock.Lock | null = null;
  protected timer: NodeJS.Timeout | null = null;

  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.redlock = new Redlock([redisClient]);
  }

  protected acquireLockRetryOnFail(
    err: Error,
    retryOnFail: boolean,
    lockKey: string,
    ttl: number,
    cb: ICallback<boolean>,
  ) {
    if (err.name === 'LockError') {
      if (retryOnFail) {
        this.acquiredLock = null;
        this.timer = setTimeout(() => {
          this.acquireLock(lockKey, ttl, true, cb);
        }, 1000);
      } else cb(null, false);
    } else cb(err);
  }

  acquireLock(
    lockKey: string,
    ttl: number,
    retryOnFail: boolean,
    cb: ICallback<boolean>,
  ): void {
    const handleRedlockReply = (err?: Error | null, lock?: Redlock.Lock) => {
      if (err) this.acquireLockRetryOnFail(err, retryOnFail, lockKey, ttl, cb);
      else if (!lock) cb(new Error('Expected an instance of Redlock.Lock'));
      else {
        this.acquiredLock = lock;
        cb(null, true);
      }
    };
    if (this.acquiredLock) this.acquiredLock.extend(ttl, handleRedlockReply);
    else {
      if (!this.redlock)
        cb(
          new Error(
            'Instance is no longer usable after calling quit(). Create a new instance.',
          ),
        );
      else this.redlock.lock(lockKey, ttl, handleRedlockReply);
    }
  }

  releaseLock(cb: ICallback<void>): void {
    if (this.timer) clearTimeout(this.timer);
    if (!this.acquiredLock) cb();
    else {
      this.acquiredLock.unlock((err?: Error | null) => {
        if (err && err.name !== 'LockError') cb(err);
        else {
          this.acquiredLock = null;
          cb();
        }
      });
    }
  }

  quit(cb?: ICallback<void>): void {
    if (!this.redlock) cb && cb();
    else {
      const callback = cb ?? (() => void 0);
      this.releaseLock(() => {
        this.redisClient = null;
        callback();
      });
    }
  }

  isLocked(): boolean {
    return this.acquiredLock !== null;
  }
}
