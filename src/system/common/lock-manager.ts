import { ICallback } from '../../../types';
import { RedisClient } from '../redis-client/redis-client';
import * as Redlock from 'redlock';

export class LockManager {
  protected redlock: Redlock;
  protected lockKey: string;
  protected acquiredLock: Redlock.Lock | null = null;
  protected timer: NodeJS.Timeout | null = null;
  protected retryOnFail: boolean;
  protected ttl: number;

  constructor(
    redisClient: RedisClient,
    lockKey: string,
    ttl: number,
    retryOnFail = false,
  ) {
    this.lockKey = lockKey;
    this.ttl = ttl;
    this.retryOnFail = retryOnFail;
    this.redlock = new Redlock([redisClient], { retryCount: 0 });
  }

  protected acquireLockRetryOnFail(err: Error, cb: ICallback<boolean>): void {
    if (err.name === 'LockError') {
      if (this.retryOnFail) {
        this.acquiredLock = null;
        this.timer = setTimeout(() => {
          this.acquireLock(cb);
        }, 1000);
      } else cb(null, false);
    } else cb(err);
  }

  acquireLock(cb: ICallback<boolean>): void {
    const handleRedlockReply = (err?: Error | null, lock?: Redlock.Lock) => {
      if (err) this.acquireLockRetryOnFail(err, cb);
      else if (!lock) cb(new Error('Expected an instance of Redlock.Lock'));
      else {
        this.acquiredLock = lock;
        cb(null, true);
      }
    };
    if (this.acquiredLock)
      this.acquiredLock.extend(this.ttl, handleRedlockReply);
    else {
      if (!this.redlock)
        cb(
          new Error(
            'Instance is no longer usable after calling quit(). Create a new instance.',
          ),
        );
      else this.redlock.lock(this.lockKey, this.ttl, handleRedlockReply);
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
      this.releaseLock(callback);
    }
  }

  isLocked(): boolean {
    return this.acquiredLock !== null;
  }

  static lockFN(
    redisClient: RedisClient,
    key: string,
    fn: (cb: ICallback<void>) => void,
    cb: ICallback<void>,
  ): void {
    const lockManager = new LockManager(redisClient, key, 10000, false);
    lockManager.acquireLock((err, locked) => {
      if (err) cb(err);
      else {
        if (locked) {
          fn((err) => {
            lockManager.quit(() => {
              if (err) cb(err);
              else cb();
            });
          });
        } else cb(new Error('Could not acquire a  lock. Try again later.'));
      }
    });
  }
}
