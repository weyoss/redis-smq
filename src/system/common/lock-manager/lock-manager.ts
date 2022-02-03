import { ICallback } from '../../../../types';
import { RedisClient } from '../redis-client/redis-client';
import { LockManagerError } from './lock-manager.error';
import { v4 as uuid } from 'uuid';
import { ELuaScriptName } from '../redis-client/lua-scripts';

export class LockManager {
  protected lockKey: string;
  protected lockId: string;
  protected isLocked = false;
  protected timer: NodeJS.Timeout | null = null;
  protected retryOnFail: boolean;
  protected ttl: number;
  protected redisClient: RedisClient;
  protected isRunning = true;

  constructor(
    redisClient: RedisClient,
    lockKey: string,
    ttl: number,
    retryOnFail = false,
  ) {
    this.lockKey = lockKey;
    this.ttl = ttl;
    this.retryOnFail = retryOnFail;
    this.lockId = uuid();
    this.redisClient = redisClient;
  }

  protected lock(cb: ICallback<string>): void {
    this.redisClient.set(this.lockKey, this.lockId, 'PX', this.ttl, 'NX', cb);
  }

  protected extend(cb: ICallback<boolean>): void {
    this.redisClient.runScript(
      ELuaScriptName.EXTEND_LOCK,
      [this.lockKey],
      [this.lockId, this.ttl],
      (err, reply) => {
        if (err) cb(err);
        else cb(null, !!reply);
      },
    );
  }

  protected release(cb: ICallback<boolean>): void {
    this.redisClient.runScript(
      ELuaScriptName.RELEASE_LOCK,
      [this.lockKey],
      [this.lockId],
      (err, reply) => {
        if (err) cb(err);
        else cb(null, !!reply);
      },
    );
  }

  acquireLock(cb: ICallback<boolean>): void {
    if (!this.isRunning) {
      cb(
        new LockManagerError(
          'Instance is no longer usable after calling quit(). Create a new instance.',
        ),
      );
    } else if (this.isLocked) {
      this.extend((err, reply) => {
        if (err) cb(err);
        else if (!reply) {
          this.isLocked = false;
          cb(
            new LockManagerError(
              `Could not extend the acquired lock with ID ${this.lockId}`,
            ),
          );
        } else cb(null, true);
      });
    } else {
      this.lock((err, reply) => {
        if (err) cb(err);
        else if (!reply) {
          if (this.retryOnFail) {
            this.timer = setTimeout(() => {
              this.acquireLock(cb);
            }, 1000);
          } else cb(null, false);
        } else {
          this.isLocked = true;
          cb(null, this.isLocked);
        }
      });
    }
  }

  releaseLock(cb: ICallback<void>): void {
    const done: ICallback<boolean> = (err) => {
      if (err) cb(err);
      else {
        // ignoring release status
        this.isLocked = false;
        cb();
      }
    };
    if (!this.isRunning) {
      cb(
        new LockManagerError(
          `Instance is no longer usable after calling quit(). Create a new instance.`,
        ),
      );
    } else {
      if (this.timer) clearTimeout(this.timer);
      if (!this.isLocked) done();
      else this.release(done);
    }
  }

  quit(cb: ICallback<void>): void {
    if (!this.isRunning) cb();
    else
      this.releaseLock((err) => {
        this.isRunning = false;
        cb(err);
      });
  }

  /*
  isLocked(): boolean {
    return this.acquiredLock !== null;
  }

  static exclusiveRun(
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
        } else
          cb(
            new LockManagerError('Could not acquire a lock. Try again later.'),
          );
      }
    });
  }
   */
}
