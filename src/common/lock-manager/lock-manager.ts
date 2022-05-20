import { ICallback } from '../../../types';
import { RedisClient } from '../redis-client/redis-client';
import { v4 as uuid } from 'uuid';
import { ELuaScriptName } from '../redis-client/lua-scripts';
import { LockManagerError } from './errors/lock-manager.error';
import { LockManagerAbortError } from './errors/lock-manager-abort.error';
import { LockManagerExtendError } from './errors/lock-manager-extend.error';
import { LockManagerAcquireError } from './errors/lock-manager-acquire.error';

enum ELockStatus {
  unlocked,
  locking,
  locked,
  releasing,
  extending,
}

export class LockManager {
  protected readonly lockId: string;
  protected readonly lockKey: string;
  protected readonly retryOnFail: boolean;
  protected readonly ttl: number;
  protected readonly redisClient: RedisClient;
  protected readonly autoExtend: boolean;

  protected status: ELockStatus = ELockStatus.unlocked;
  protected lockingTimer: NodeJS.Timeout | null = null;
  protected autoExtendTimer: NodeJS.Timeout | null = null;

  constructor(
    redisClient: RedisClient,
    lockKey: string,
    ttl: number,
    retryOnFail = false,
    autoExtend = false,
  ) {
    this.lockKey = lockKey;
    this.ttl = ttl;
    this.retryOnFail = retryOnFail;
    this.lockId = uuid();
    this.redisClient = redisClient;
    this.autoExtend = autoExtend;
  }

  protected resetTimers(): void {
    if (this.lockingTimer) {
      clearTimeout(this.lockingTimer);
      this.lockingTimer = null;
    }
    if (this.autoExtendTimer) {
      clearTimeout(this.autoExtendTimer);
      this.autoExtendTimer = null;
    }
  }

  protected setUnlocked(): void {
    this.status = ELockStatus.unlocked;
  }

  protected setLocked(): void {
    this.status = ELockStatus.locked;
  }

  protected extend(cb: ICallback<void>): void {
    if (this.status !== ELockStatus.locked) {
      cb(
        new LockManagerError(
          'The lock is currently not acquired or a pending operation is in progress',
        ),
      );
    } else {
      this.status = ELockStatus.extending;
      this.redisClient.runScript(
        ELuaScriptName.EXTEND_LOCK,
        [this.lockKey],
        [this.lockId, this.ttl],
        (err, reply) => {
          if (err) cb(err);
          else {
            if (this.status === ELockStatus.extending) {
              if (!reply) {
                this.setUnlocked();
                cb(new LockManagerExtendError());
              } else {
                this.setLocked();
                cb();
              }
            } else {
              cb(new LockManagerAbortError());
            }
          }
        },
      );
    }
  }

  protected runAutoExtendTimer(): void {
    const ms = Math.ceil(this.ttl / 2);
    this.autoExtendTimer = setTimeout(
      () =>
        this.extend((err) => {
          if (!err) this.runAutoExtendTimer();
          else if (!(err instanceof LockManagerAbortError)) throw err;
        }),
      ms,
    );
  }

  acquireLock(cb: ICallback<void>): void {
    if (this.status !== ELockStatus.unlocked) {
      cb(
        new LockManagerError(
          `The lock is currently not released or a pending operation is in progress`,
        ),
      );
    } else {
      this.status = ELockStatus.locking;
      const lock = () => {
        if (this.status === ELockStatus.locking) {
          this.redisClient.set(
            this.lockKey,
            this.lockId,
            'PX',
            this.ttl,
            'NX',
            (err, reply) => {
              if (err) cb(err);
              else if (this.status === ELockStatus.locking) {
                if (!reply) {
                  if (this.retryOnFail)
                    this.lockingTimer = setTimeout(lock, 1000);
                  else {
                    this.setUnlocked();
                    cb(new LockManagerAcquireError());
                  }
                } else {
                  this.setLocked();
                  if (this.autoExtend) {
                    this.runAutoExtendTimer();
                  }
                  cb();
                }
              } else {
                cb(new LockManagerAbortError());
              }
            },
          );
        } else {
          cb(new LockManagerAbortError());
        }
      };
      lock();
    }
  }

  extendLock(cb: ICallback<void>): void {
    if (this.autoExtend) {
      cb(
        new LockManagerError(
          `Can not extend a lock when autoExtend is enabled`,
        ),
      );
    } else this.extend(cb);
  }

  releaseLock(cb: ICallback<void>): void {
    const status = this.status;
    if (status === ELockStatus.releasing)
      cb(new LockManagerError('A pending releaseLock() call is in progress'));
    else if (status === ELockStatus.unlocked) cb();
    else {
      this.resetTimers();
      this.status = ELockStatus.releasing;
      this.redisClient.runScript(
        ELuaScriptName.RELEASE_LOCK,
        [this.lockKey],
        [this.lockId],
        (err) => {
          if (err) cb(err);
          else {
            this.setUnlocked();
            cb();
          }
        },
      );
    }
  }

  isLocked(): boolean {
    return (
      this.status === ELockStatus.locked ||
      this.status === ELockStatus.extending
    );
  }

  getId(): string {
    return this.lockId;
  }
}
