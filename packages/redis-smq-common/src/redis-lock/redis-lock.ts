/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { resolve } from 'path';
import { ICallback } from '../async/index.js';
import { env } from '../env/index.js';
import { AbortError } from '../errors/index.js';
import { ILogger } from '../logger/index.js';
import { IRedisClient } from '../redis-client/index.js';
import {
  LockNotAcquiredError,
  ExtendLockError,
  AcquireLockNotAllowedError,
  NotLockedError,
} from './errors/index.js';
import { Runnable } from '../runnable/index.js';
import { Timer } from '../timer/index.js';
import { Backoff } from '../backoff/backoff.js';
import { ExponentialBackoff } from '../backoff/index.js';

const dir = env.getCurrentDir();

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
export class RedisLock extends Runnable<TLockerEvent> {
  protected readonly lockKey;
  protected readonly ttl;
  protected readonly redisClient;
  protected readonly autoExtendInterval: number = 0;
  protected readonly timer: Timer;
  protected logger;
  protected backoff: Backoff | null = null;

  constructor(
    redisClient: IRedisClient,
    logger: ILogger,
    lockKey: string,
    ttl: number,
    retryOnFail = false,
    autoExtend = false,
  ) {
    super();
    this.lockKey = lockKey;

    if (ttl < 3_000) {
      throw new Error(`Lock TTL is too small`);
    }
    this.ttl = ttl;
    if (autoExtend) {
      this.autoExtendInterval = Math.floor(ttl / 3); // update 3 times
    }

    this.logger = logger.createLogger(this.constructor.name);
    this.timer = new Timer(this.logger);

    this.redisClient = redisClient;
    this.redisClient.on('error', this.handleError);

    // Initialize backoff if retry is enabled
    if (retryOnFail) {
      this.backoff = new ExponentialBackoff(logger, { maxAttempts: 0 }); // unlimited retries
    }

    this.logger.debug('RedisLock initialization complete');
  }

  /**
   * Attempts to acquire a lock for the current instance using Redis.
   *
   * @param cb - A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.
   *
   * @returns {void}
   */
  protected lock = (cb: ICallback): void => {
    this.logger.debug(`Attempting to acquire lock for key: ${this.lockKey}`);

    const execFn = (done: ICallback) => {
      this.redisClient.set(
        this.lockKey,
        this.id,
        {
          expire: { mode: 'PX', value: this.ttl },
          exists: 'NX',
        },
        (err, reply) => {
          if (!this.isGoingUp()) {
            this.logger.warn(
              'Lock acquisition aborted: instance is no longer in going-up state',
            );
            return done(new AbortError());
          }

          if (err) {
            this.logger.error(`Error acquiring lock: ${err.message}`, err);
            return done(
              new AbortError({
                message: err.message,
              }),
            );
          }

          if (!reply) {
            this.logger.warn(
              'Failed to acquire lock: already held by another instance',
            );
            return done(new LockNotAcquiredError());
          }

          this.logger.debug(
            `Lock acquired successfully for key: ${this.lockKey}`,
          );

          done();
        },
      );
    };

    // Use backoff for retries if enabled
    if (this.backoff) {
      return this.backoff.execute(execFn, cb);
    }

    execFn(cb);
  };

  /**
   * Attempts to extend the lock's time-to-live (TTL) in Redis.
   *
   * @param cb - A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.
   *
   * @returns {void}
   */
  protected extend = (cb: ICallback): void => {
    if (!this.isRunning()) {
      this.logger.warn('Cannot extend lock: lock is not currently held');
      return cb(new NotLockedError());
    }

    this.redisClient.runScript(
      ELuaScript.EXTEND_LOCK,
      [this.lockKey],
      [this.id, this.ttl],
      (err, reply) => {
        if (err) {
          this.logger.error(`Error extending lock TTL: ${err.message}`, err);
          return cb(err);
        }

        if (!this.isRunning()) {
          this.logger.warn(
            'Lock extension aborted: instance is no longer in running state',
          );
          return cb(new AbortError());
        }

        if (reply !== 1) {
          this.logger.warn(
            'Failed to extend lock: lock no longer held by this instance',
          );
          return this.shutdown(() => cb(new ExtendLockError()));
        }

        cb();
      },
    );
  };

  /**
   * Releases the lock held by the current instance.
   *
   * @param cb - A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.
   *
   * @returns {void}
   */
  protected release = (cb: ICallback): void => {
    this.logger.debug(`Attempting to release lock for key: ${this.lockKey}`);

    this.redisClient.runScript(
      ELuaScript.RELEASE_LOCK,
      [this.lockKey],
      [this.id],
      (err) => {
        if (err) {
          this.logger.error(`Error releasing lock: ${err.message}`, err);
        } else {
          this.logger.debug(
            `Lock released successfully for key: ${this.lockKey}`,
          );
        }
        cb(err);
      },
    );
  };

  /**
   * Automatically extends the lock's time-to-live (TTL) if auto-extension is enabled.
   *
   * @returns {void}
   */
  protected autoExtendLock(): void {
    if (!this.autoExtendInterval || !this.isRunning()) {
      return;
    }

    this.timer.schedule(() => {
      this.extend((err) => {
        if (err) {
          if (err instanceof AbortError) return;
          this.handleError(err);
        }
        this.autoExtendLock();
      });
    }, this.autoExtendInterval);
  }

  /**
   * Overrides the `goingUp` method from the `Runnable` class to handle the lock acquisition process.
   *
   * @returns {Array<(cb: ICallback<void>) => void>} - An array of functions to execute during startup.
   */
  protected override goingUp(): Array<(cb: ICallback) => void> {
    this.logger.debug('RedisLock transitioning to going-up state');
    this.emit('locker.goingUp', this.id);

    return super.goingUp().concat([
      (cb) => this.timer.run(cb),
      (cb) => {
        if (this.backoff) this.backoff.run(cb);
        else cb();
      },
      (cb) => {
        this.logger.debug('Loading Redis Lua scripts');
        this.redisClient.loadScriptFiles(luaScriptMap, (err) => {
          if (err) {
            this.logger.error(
              `Failed to load Redis Lua scripts: ${err.message}`,
              err,
            );
            this.handleError(err);
          } else {
            this.logger.debug('Redis Lua scripts loaded successfully');
          }
          cb(err);
        });
      },
      this.lock,
    ]);
  }

  /**
   * Overrides the `goingDown` method from the `Runnable` class to handle the lock release process.
   *
   * @returns {Array<(cb: ICallback<void>) => void>} - An array of functions to execute during shutdown.
   */
  protected override goingDown(): Array<(cb: ICallback) => void> {
    this.logger.debug('RedisLock transitioning to going-down state');
    this.emit('locker.goingDown', this.id);

    return [
      (cb: ICallback) => {
        if (this.backoff) this.backoff.shutdown(cb);
        else cb();
      },
      this.release,
    ].concat(super.goingDown());
  }

  /**
   * Overrides the `handleError` method from the `Runnable` class to handle errors and emit events.
   *
   * @param err - The error that occurred during the execution.
   *
   * @returns {void}
   */
  protected override handleError = (err: Error): void => {
    if (!this.isOperational()) return;

    this.logger.error(`RedisLock error: ${err.message}`, err);
    this.emit('locker.error', err, this.id);
    super.handleError(err);
  };

  /**
   * Overrides the `up` method from the `Runnable` class to emit events when the locker transitions to the 'up' state.
   *
   * @returns {void}
   */
  protected override finalizeUp(): void {
    super.finalizeUp();
    this.logger.debug(
      `RedisLock transitioned to up state for key: ${this.lockKey}`,
    );
    this.emit('locker.up', this.id);

    // Start auto-extension if enabled
    if (this.autoExtendInterval) {
      this.logger.debug(
        `Auto-extension enabled with interval: ${this.autoExtendInterval}ms`,
      );
      this.autoExtendLock();
    }
  }

  /**
   * Overrides the `down` method from the `Runnable` class to emit events when the locker transitions to the 'down' state.
   *
   * @returns {void}
   */
  protected override finalizeDown(): void {
    super.finalizeDown();
    this.logger.debug(
      `RedisLock transitioned to down state for key: ${this.lockKey}`,
    );
    this.emit('locker.down', this.id);
  }

  /**
   * Overrides the `run` method from the `Runnable` class to handle the lock acquisition process.
   *
   * @param cb - A callback function that will be invoked with an error (if any) upon successful execution.
   *
   * @returns {void}
   */
  override run(cb: ICallback): void {
    this.logger.debug(`Attempting to run RedisLock for key: ${this.lockKey}`);

    super.run((err) => {
      if (err instanceof LockNotAcquiredError) {
        this.logger.debug(
          `Lock already held by another instance for key: ${this.lockKey}`,
        );
        return cb(err);
      }

      if (err) {
        this.logger.error(`Error running RedisLock: ${err.message}`, err);
        return cb(err);
      }

      this.logger.debug(
        `RedisLock running successfully for key: ${this.lockKey}`,
      );

      cb(null);
    });
  }

  /**
   * Attempts to acquire a lock for the current instance.
   *
   * @param cb - A callback function that will be invoked with an error (if any) upon successful execution.
   *
   * @returns {void}
   */
  acquireLock(cb: ICallback): void {
    this.logger.debug(`Acquiring lock for key: ${this.lockKey}`);
    this.run(cb);
  }

  /**
   * Releases the lock held by the current instance.
   *
   * @param cb - A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.
   *
   * @returns {void}
   */
  releaseLock(cb: ICallback): void {
    this.logger.debug(`Releasing lock for key: ${this.lockKey}`);
    this.shutdown(cb);
  }

  /**
   * Attempts to extend the lock's time-to-live (TTL) if auto-extension is not enabled.
   *
   * @param cb - A callback function that will be invoked with an error (if any) or `undefined` upon successful execution.
   *
   * @returns {void}
   */
  extendLock(cb: ICallback): void {
    this.logger.debug(
      `Manual extension of lock requested for key: ${this.lockKey}`,
    );

    if (this.autoExtendInterval) {
      this.logger.warn(
        'Cannot manually extend lock: auto-extension is enabled',
      );
      return cb(new AcquireLockNotAllowedError());
    }

    if (!this.isRunning()) {
      this.logger.warn('Cannot extend lock: lock is not currently held');
      return cb(new NotLockedError());
    }

    this.logger.debug('Extending lock TTL');
    this.extend(cb);
  }

  /**
   * Checks if the lock is currently held.
   *
   * @returns {boolean} - Returns `true` if the lock is held, `false` otherwise.
   */
  isLocked(): boolean {
    const locked = this.powerSwitch.isRunning();
    this.logger.debug(
      `Lock status check for key ${this.lockKey}: ${locked ? 'locked' : 'not locked'}`,
    );
    return locked;
  }

  /**
   * Checks if the lock is released.
   *
   * @returns {boolean} - Returns `true` if the lock is released, `false` otherwise.
   */
  isReleased(): boolean {
    const released = this.powerSwitch.isDown();
    this.logger.debug(
      `Lock release status check for key ${this.lockKey}: ${released ? 'released' : 'not released'}`,
    );
    return released;
  }

  /**
   * Gets the current retry attempt count if backoff is enabled.
   *
   * @returns {number} - The current attempt count, or 0 if backoff is not enabled.
   */
  getRetryAttempts(): number {
    return this.backoff?.getAttempts() ?? 0;
  }
}
