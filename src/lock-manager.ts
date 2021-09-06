import { IConfig, TCallback, TCompatibleRedisClient } from '../types';
import { RedisClient } from './redis-client';
import * as Redlock from 'redlock';

export class LockManager {
  protected redisClient: TCompatibleRedisClient | null = null;
  protected redlock: Redlock | null = null;
  protected acquiredLock: Redlock.Lock | null = null;
  protected timer: NodeJS.Timeout | null = null;

  constructor(redisClient: TCompatibleRedisClient) {
    this.redisClient = redisClient;
    this.redlock = new Redlock([redisClient]);
  }

  protected setAcquiredLock(
    lock: Redlock.Lock,
    extended: boolean,
    cb: TCallback<boolean>,
  ): void {
    if (this.redlock) {
      this.acquiredLock = lock;
      cb(null, extended);
    } else cb(new Error('Instance no longer usable after calling quit()'));
  }

  acquireLock(lockKey: string, ttl: number, cb: TCallback<boolean>): void {
    const retry = (err: Error) => {
      if (err && err.name !== 'LockError') cb(err);
      else {
        this.acquiredLock = null;
        this.timer = setTimeout(() => {
          this.acquireLock(lockKey, ttl, cb);
        }, 1000);
      }
    };
    if (this.acquiredLock) {
      this.acquiredLock.extend(
        ttl,
        (err?: Error | null, lock?: Redlock.Lock) => {
          if (err) retry(err);
          else {
            if (!lock) {
              throw new Error();
            }
            this.setAcquiredLock(lock, true, cb);
          }
        },
      );
    } else {
      if (!this.redlock)
        cb(
          new Error(
            'Instance is no longer usable after calling quit(). Create a new instance.',
          ),
        );
      else {
        this.redlock.lock(
          lockKey,
          ttl,
          (err?: Error | null, lock?: Redlock.Lock) => {
            if (err) retry(err);
            else {
              if (!lock) {
                throw new Error();
              }
              this.setAcquiredLock(lock, false, cb);
            }
          },
        );
      }
    }
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

  static getInstance(
    config: IConfig,
    cb: (lockManager: LockManager) => void,
  ): void {
    RedisClient.getNewInstance(
      config,
      (redisClient: TCompatibleRedisClient) => {
        const instance = new LockManager(redisClient);
        cb(instance);
      },
    );
  }
}
