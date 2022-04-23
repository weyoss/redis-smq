import { ICallback } from '../../../../types';
import { RedisClient } from '../redis-client/redis-client';
import { v4 as uuid } from 'uuid';
import { ELuaScriptName } from '../redis-client/lua-scripts';
import { LockManagerError } from './lock-manager.error';

enum ELockStatus {
  unlocked,
  locking,
  locked,
  unlocking,
}

export class LockManager {
  protected readonly lockId: string;
  protected readonly lockKey: string;
  protected readonly retryOnFail: boolean;
  protected readonly ttl: number;
  protected readonly redisClient: RedisClient;

  protected status: ELockStatus = ELockStatus.unlocked;
  protected timer: NodeJS.Timeout | null = null;

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

  protected retry(cb: ICallback<boolean>): void {
    this.timer = setTimeout(() => {
      this.lock(cb);
    }, 1000);
  }

  protected lock(cb: ICallback<boolean>): void {
    if (this.status === ELockStatus.locking) {
      this.redisClient.set(
        this.lockKey,
        this.lockId,
        'PX',
        this.ttl,
        'NX',
        (err, reply) => {
          if (err) cb(err);
          else if (!reply) {
            if (this.retryOnFail) this.retry(cb);
            else cb(null, false);
          } else cb(null, true);
        },
      );
    } else cb(null, false);
  }

  protected extend(cb: ICallback<boolean>): void {
    this.redisClient.runScript(
      ELuaScriptName.EXTEND_LOCK,
      [this.lockKey],
      [this.lockId, this.ttl],
      (err, reply) => {
        if (err) cb(err);
        else if (!!reply) cb(null, true);
        else this.lock(cb);
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
    const status = this.status;
    if (status === ELockStatus.unlocking || status === ELockStatus.locking) {
      cb(
        new LockManagerError(
          `Can not acquire lock while a acquireLock() or releaseLock() call is pending`,
        ),
      );
    } else {
      const done: ICallback<boolean> = (err, status) => {
        this.status = status ? ELockStatus.locked : ELockStatus.unlocked;
        cb(err, status);
      };
      this.status = ELockStatus.locking;
      if (status === ELockStatus.locked) this.extend(done);
      else this.lock(done);
    }
  }

  releaseLock(cb: ICallback<void>): void {
    const status = this.status;
    if (status === ELockStatus.unlocking)
      cb(new LockManagerError('releaseLock() has been already called'));
    else if (status === ELockStatus.unlocked) cb();
    else {
      this.status = ELockStatus.unlocking;
      if (this.timer) clearTimeout(this.timer);
      this.release((err) => {
        if (err) cb(err);
        else {
          this.status = ELockStatus.unlocked;
          cb();
        }
      });
    }
  }
}
