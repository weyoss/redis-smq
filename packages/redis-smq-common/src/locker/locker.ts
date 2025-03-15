/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { resolve } from 'path';
import { ICallback } from '../common/index.js';
import { getDirname } from '../env/index.js';
import { AbortError } from '../errors/index.js';
import { ILogger } from '../logger/index.js';
import { IRedisClient } from '../redis-client/index.js';
import { Runnable } from '../runnable/index.js';
import { Timer } from '../timer/index.js';
import {
  LockAcquireError,
  LockExtendError,
  LockMethodNotAllowedError,
  LockNotAcquiredError,
} from './errors/index.js';

const dir = getDirname();

export type TLockerEvent = {
  'locker.up': (id: string) => void;
  'locker.down': (id: string) => void;
  'locker.goingUp': (id: string) => void;
  'locker.goingDown': (id: string) => void;
  'locker.error': (error: Error, id: string) => void;
};

enum ELuaScript {
  RELEASE_LOCK = 'RELEASE_LOCK',
  EXTEND_LOCK = 'EXTEND_LOCK',
}

const luaScriptMap = {
  [ELuaScript.RELEASE_LOCK]: resolve(dir, './lua-scripts/release-lock.lua'),
  [ELuaScript.EXTEND_LOCK]: resolve(dir, './lua-scripts/extend-lock.lua'),
};

/**
 * Represents a distributed locking mechanism using Redis.
 * Extends the Runnable class and implements locking, extending, and releasing operations.
 */
export class Locker extends Runnable<TLockerEvent> {
  protected readonly lockKey;
  protected readonly retryOnFail;
  protected readonly ttl;
  protected readonly redisClient;
  protected readonly autoExtendInterval;
  protected readonly timer;
  protected readonly logger;

  constructor(
    redisClient: IRedisClient,
    logger: ILogger,
    lockKey: string,
    ttl: number,
    retryOnFail = false,
    autoExtendInterval: number = 0,
  ) {
    super();
    this.lockKey = lockKey;
    this.ttl = ttl;
    this.retryOnFail = retryOnFail;
    this.autoExtendInterval = autoExtendInterval;
    this.logger = logger;

    this.redisClient = redisClient;
    this.redisClient.on('error', this.handleError);
    this.redisClient.loadScriptFiles(luaScriptMap, () => void 0);

    this.timer = new Timer();
    this.timer.on('error', this.handleError);
  }

  /**
   * Attempts to acquire a lock for the current instance using Redis.
   *
   * @param cb - A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.
   *
   * @remarks
   * This function uses the Redis client to set a key with an expiration time (TTL).
   * If the key already exists, the function will return an error unless the `exists` option is set to 'NX'.
   * If the lock is acquired successfully, the callback is invoked with `undefined`.
   * If the lock acquisition fails due to a lock already being held by another instance,
   * the function will retry acquiring the lock after a delay if `retryOnFail` is enabled.
   * If the lock acquisition process is aborted due to the instance transitioning to a different state,
   * the function will return an `AbortError`.
   *
   * @returns {void}
   */
  protected lock = (cb: ICallback<void>): void => {
    this.redisClient.set(
      this.lockKey,
      this.id,
      {
        expire: { mode: 'PX', value: this.ttl },
        exists: 'NX',
      },
      (err, reply) => {
        if (err) return cb(err);
        if (!this.powerSwitch.isGoingUp()) return cb(new AbortError());
        if (!reply) {
          return this.retryOnFail
            ? this.timer.setTimeout(() => this.lock(cb), 1000)
            : cb(new LockAcquireError());
        }
        cb();
      },
    );
  };

  /**
   * Attempts to extend the lock's time-to-live (TTL) in Redis.
   *
   * This function uses the provided Redis client to execute a Lua script that extends the lock's TTL.
   * If the lock is not currently held by this instance, an error is returned.
   * If the lock cannot be extended due to an error or an abort signal, the error is passed to the callback.
   * If the lock is successfully extended, the callback is invoked with `undefined`.
   *
   * @param cb - A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.
   *
   * @throws {LockNotAcquiredError} - If the lock is not currently held by this instance.
   *
   * @returns {void}
   */
  protected extend = (cb: ICallback<void>): void => {
    if (!this.isRunning()) return cb(new LockNotAcquiredError());
    this.redisClient.runScript(
      ELuaScript.EXTEND_LOCK,
      [this.lockKey],
      [this.id, this.ttl],
      (err, reply) => {
        if (err) return cb(err);
        if (!this.powerSwitch.isRunning()) return cb(new AbortError());
        if (reply !== 1) return this.shutdown(() => cb(new LockExtendError()));
        cb();
      },
    );
  };

  /**
   * Releases the lock held by the current instance.
   *
   * This method attempts to release the lock held by the current instance.
   * If the lock is not currently held, the method does nothing and invokes the callback with `undefined`.
   * If an error occurs during the release process, the callback is invoked with the corresponding error.
   *
   * @param cb - A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.
   *
   * @returns {void}
   */
  protected release = (cb: ICallback<void>): void => {
    this.redisClient.runScript(
      ELuaScript.RELEASE_LOCK,
      [this.lockKey],
      [this.id],
      (err) => cb(err),
    );
  };

  /**
   * Resets the timer used for lock auto-extension.
   *
   * This function resets the timer that is used to periodically extend the lock's time-to-live (TTL) in Redis.
   * It does not release the lock held by the current instance.
   *
   * @param cb - A callback function that will be invoked with `undefined` upon successful execution.
   *
   * @returns {void}
   *
   * @remarks
   * This method is called internally by the `goingDown` method to ensure that the timer is reset when the locker transitions to the 'down' state.
   * It is also used by the `run` method to reset the timer before attempting to acquire a new lock.
   */
  protected resetTimer = (cb: ICallback<void>): void => {
    this.timer.reset();
    cb();
  };

  /**
   * Automatically extends the lock's time-to-live (TTL) if auto-extension is enabled.
   * This method checks if auto-extension is enabled and if so, it sets a timeout to extend the lock.
   * If the lock cannot be extended due to an error or an abort signal, the error is handled and the method is called recursively.
   *
   * @remarks
   * This method is called internally by the `goingUp` method and is responsible for managing the automatic lock extension process.
   *
   * @returns {void}
   */
  protected autoExtendLock(): void {
    if (this.autoExtendInterval) {
      this.timer.setTimeout(
        () =>
          this.extend((err) => {
            if (err && !(err instanceof AbortError)) {
              this.handleError(err);
            } else if (!err) {
              this.autoExtendLock();
            }
          }),
        this.autoExtendInterval,
      );
    }
  }

  /**
   * Overrides the `goingUp` method from the `Runnable` class to handle the lock acquisition process.
   *
   * @returns {Array<(cb: ICallback<void>) => void>} - An array of functions that will be executed
   * when the locker transitions to the 'up' state. The array includes the parent class's `goingUp` method
   * and the `lock` method.
   *
   * @remarks
   * This method attempts to acquire a lock for the current instance using the Redis client.
   * If the lock is successfully acquired, the callback is invoked with `undefined`.
   * If the lock acquisition fails due to a lock already being held by another instance,
   * the function will retry acquiring the lock after a delay if `retryOnFail` is enabled.
   * If the lock acquisition process is aborted due to the instance transitioning to a different state,
   * the function will return an `AbortError`.
   */
  protected override goingUp(): Array<(cb: ICallback<void>) => void> {
    return super.goingUp().concat([this.lock]);
  }

  /**
   * Overrides the `goingDown` method from the `Runnable` class to handle the lock release process.
   *
   * @returns {Array<(cb: ICallback<void>) => void>} - An array of functions that will be executed
   * when the locker transitions to the 'down' state. The array includes the `resetTimer` method,
   * the `release` method, and the parent class's `goingDown` method.
   *
   * @remarks
   * This method releases the lock held by the current instance and resets the timer used for lock auto-extension.
   * If the lock is not currently held, the method does nothing and invokes the callback with `undefined`.
   * If an error occurs during the release process, the callback is invoked with the corresponding error.
   */
  protected override goingDown(): Array<(cb: ICallback<void>) => void> {
    return [this.resetTimer, this.release].concat(super.goingDown());
  }

  /**
   * Overrides the `handleError` method from the `Runnable` class to handle errors and emit events.
   *
   * @param err - The error that occurred during the execution.
   *
   * @returns {void}
   */
  protected override handleError = (err: Error): void => {
    this.emit('locker.error', err, this.id);
    super.handleError(err);
  };

  /**
   * Retrieves the logger instance used by the Locker class.
   *
   * @returns {ILogger} - The logger instance used by the Locker class.
   */
  protected override getLogger(): ILogger {
    return this.logger;
  }

  /**
   * Overrides the `run` method from the `Runnable` class to handle the lock acquisition process.
   *
   * @param cb - A callback function that will be invoked with a boolean indicating the lock acquisition result,
   * or an error (if any) upon successful execution.
   *
   * @returns {void}
   *
   * @remarks
   * This method attempts to acquire a lock for the current instance using the Redis client.
   * If the lock is successfully acquired, the callback is invoked with `true`.
   * If the lock acquisition fails due to a lock already being held by another instance,
   * the callback is invoked with `false`. If an error occurs during the lock acquisition process,
   * the callback is invoked with the corresponding error.
   *
   * If auto-extension is enabled, the lock's TTL will be extended automatically at regular intervals.
   */
  override run(cb: ICallback<boolean>): void {
    super.run((err, reply) => {
      if (err instanceof LockAcquireError) return cb(null, false);
      if (err) return cb(err);
      if (reply) this.autoExtendLock();
      cb(null, Boolean(reply));
    });
  }

  /**
   * Attempts to acquire a lock for the current instance.
   *
   * This method attempts to acquire a lock for the current instance using the Redis client.
   * If the lock is successfully acquired, the callback is invoked with `true`.
   * If the lock acquisition fails due to a lock already being held by another instance,
   * the callback is invoked with `false`. If an error occurs during the lock acquisition process,
   * the callback is invoked with the corresponding error.
   *
   * If auto-extension is enabled, the lock's TTL will be extended automatically at regular intervals.
   *
   * @param cb - A callback function that will be invoked with a boolean indicating the lock acquisition result,
   * or an error (if any) upon successful execution.
   *
   * @returns {void}
   */
  acquireLock(cb: ICallback<boolean>): void {
    this.run(cb);
  }

  /**
   * Releases the lock held by the current instance.
   *
   * This method attempts to release the lock held by the current instance.
   * If the lock is not currently held, the method does nothing and invokes the callback with `undefined`.
   * If an error occurs during the release process, the callback is invoked with the corresponding error.
   *
   * @param cb - A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.
   *
   * @returns {void}
   */
  releaseLock(cb: ICallback<void>): void {
    this.shutdown(cb);
  }

  /**
   * Attempts to extend the lock's time-to-live (TTL) if auto-extension is not enabled.
   *
   * This function extends the lock's TTL by the specified time, provided that auto-extension is not enabled.
   * If auto-extension is enabled, an error is returned. If the lock is not currently held, an error is returned.
   *
   * @param cb - A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.
   *
   * @throws {LockMethodNotAllowedError} - If auto-extension is enabled.
   * @throws {LockNotAcquiredError} - If the lock is not currently held.
   *
   * @returns {void}
   */
  extendLock(cb: ICallback<void>): void {
    if (this.autoExtendInterval) return cb(new LockMethodNotAllowedError());
    if (!this.powerSwitch.isRunning()) return cb(new LockNotAcquiredError());
    this.extend(cb);
  }

  /**
   * Checks if the lock is currently held.
   *
   * This method returns a boolean indicating whether the lock is currently held by this instance.
   *
   * @returns {boolean} - Returns `true` if the lock is held, `false` otherwise.
   */
  isLocked(): boolean {
    return this.powerSwitch.isRunning();
  }

  /**
   * Checks if the lock is released.
   *
   * This method returns a boolean indicating whether the lock is currently released.
   *
   * @returns {boolean} - Returns `true` if the lock is released, `false` otherwise.
   */
  isReleased(): boolean {
    return this.powerSwitch.isDown();
  }
}
