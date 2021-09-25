import { TCallback } from '../types';
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

  protected getRedlock() {
    if (!this.redlock) {
      throw new Error(
        'Instance is no longer usable after calling quit(). Create a new instance.',
      );
    }
    return this.redlock;
  }

  protected acquireLockRetryOnFail(
    err: Error,
    retryOnFail: boolean,
    lockKey: string,
    ttl: number,
    cb: TCallback<boolean>,
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
    cb: TCallback<boolean>,
  ): void {
    const handleRedlockReply = (err?: Error | null, lock?: Redlock.Lock) => {
      if (err) this.acquireLockRetryOnFail(err, retryOnFail, lockKey, ttl, cb);
      else if (!lock) cb(new Error('Expected a Redlock instance'));
      else {
        this.acquiredLock = lock;
        cb(null, true);
      }
    };
    if (this.acquiredLock) this.acquiredLock.extend(ttl, handleRedlockReply);
    else this.getRedlock().lock(lockKey, ttl, handleRedlockReply);
  }

  releaseLock(cb: TCallback<void>): void {
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

  quit(cb: TCallback<void>): void {
    if (!this.redlock) cb();
    else {
      this.releaseLock((err) => {
        if (err) cb(err);
        else {
          this.redlock?.quit(() => {
            this.redlock = null;
            cb();
          });
        }
      });
    }
  }

  isLocked(): boolean {
    return this.acquiredLock !== null;
  }
}
