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
import { OperationAbortedError } from '../errors/index.js';
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
import { withOptionalCallback } from '../async/with-optional-callback.js';

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
 * Distributed lock backed by Redis, implemented as a `Runnable`.
 *
 * ## Two-phase lifecycle
 *
 * `acquireLock()` / `releaseLock()` drive the underlying `Runnable`
 * lifecycle (`DOWN → GOING_UP → UP → GOING_DOWN → DOWN`). `GOING_UP`
 * loads Lua scripts, runs the backoff (if enabled), and executes the
 * lock-acquisition `SET NX PX`. `GOING_DOWN` shuts down the backoff and
 * timer, releases the lock via Lua, then lets `Runnable` complete the
 * state transition.
 *
 * ## Rollback semantics
 *
 * `Runnable`'s lifecycle rollback (on failure in `GOING_UP`) is one-way
 * — the state returns to `DOWN`, and a subsequent `run()` can retry.
 * Same asymmetry as `Lifecycle` itself: shutdown is not rollback-able.
 *
 * ## Listener ownership
 *
 * The constructor registers a Redis `'error'` listener on the shared
 * `redisClient` — this is per-instance state that must be released
 * when the lock shuts down. `goingDown` removes it before `release`
 * runs, so late Redis errors during release-teardown don't re-enter
 * `handleError` on a half-torn-down lock.
 */
export class RedisLock extends Runnable<TLockerEvent> {
  protected readonly lockKey: string;
  protected readonly ttl: number;
  protected readonly redisClient: IRedisClient;
  protected readonly autoExtendInterval: number = 0;
  protected readonly timer: Timer;
  protected readonly logger: ILogger;
  protected readonly backoff: Backoff | null = null;

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
      this.autoExtendInterval = Math.floor(ttl / 3);
    }

    this.logger = logger.createLogger(this.constructor.name);
    this.timer = new Timer(this.logger);

    this.redisClient = redisClient;
    this.redisClient.on('error', this.handleError);

    if (retryOnFail) {
      this.backoff = new ExponentialBackoff(logger, { maxAttempts: 0 });
    }

    this.logger.debug('RedisLock initialization complete');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Runnable lifecycle hooks
  // ═══════════════════════════════════════════════════════════════════════

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
          } else {
            this.logger.debug('Redis Lua scripts loaded successfully');
          }
          cb(err);
        });
      },
      this.lock,
    ]);
  }

  protected override goingDown(): Array<(cb: ICallback) => void> {
    this.logger.debug('RedisLock transitioning to going-down state');
    this.emit('locker.goingDown', this.id);

    return [
      // Stop the backoff. Ignore errors — the backoff may not have been
      // started if `goingUp` failed before reaching its step, and even if
      // it was, an error here shouldn't abort teardown.
      (cb: ICallback) => {
        if (this.backoff) this.backoff.shutdown(() => cb());
        else cb();
      },

      // Stop the timer. Same reasoning: `Timer` may be in any state
      // depending on how far `goingUp` progressed. Suppressing its
      // shutdown error keeps the teardown sequence moving.
      (cb: ICallback) => {
        this.timer.shutdown(() => cb());
      },

      // Release the Redis-side lock. Called before we detach the error
      // listener because `release` itself uses `redisClient.runScript`;
      // any error it produces is handled by its own callback, not by
      // `handleError`.
      this.release,

      // Now that we're done using `redisClient`, drop the error listener.
      // Without this, every `RedisLock` instance would leave a permanent
      // listener on the shared client — a leak that grows with each
      // create/destroy cycle (`WorkerCluster` creates locks dynamically).
      (cb: ICallback) => {
        this.redisClient.removeListener('error', this.handleError);
        cb();
      },
    ].concat(super.goingDown());
  }

  protected override finalizeUp(): void {
    super.finalizeUp();
    this.logger.debug(
      `RedisLock transitioned to up state for key: ${this.lockKey}`,
    );
    this.emit('locker.up', this.id);

    if (this.autoExtendInterval) {
      this.logger.debug(
        `Auto-extension enabled with interval: ${this.autoExtendInterval}ms`,
      );
      this.autoExtendLock();
    }
  }

  protected override finalizeDown(): void {
    super.finalizeDown();
    this.logger.debug(
      `RedisLock transitioned to down state for key: ${this.lockKey}`,
    );
    this.emit('locker.down', this.id);
  }

  protected override handleError = (err: Error): void => {
    if (!this.isOperational()) return;

    this.logger.error(`RedisLock error: ${err.message}`, err);
    this.emit('locker.error', err, this.id);
    super.handleError(err);
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Lock acquisition / extension / release
  // ═══════════════════════════════════════════════════════════════════════

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
            return done(new OperationAbortedError());
          }

          if (err) {
            this.logger.error(`Error acquiring lock: ${err.message}`, err);
            return done(
              new OperationAbortedError({
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

    if (this.backoff) {
      return this.backoff.execute(execFn, cb);
    }

    execFn(cb);
  };

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
          return cb(new OperationAbortedError());
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
          if (err instanceof OperationAbortedError) return;
          this.handleError(err);
        }
        this.autoExtendLock();
      });
    }, this.autoExtendInterval);
  }

  // ═══════════════════════════════════════════════════════════════════════
  // Public API
  // ═══════════════════════════════════════════════════════════════════════

  override run(): Promise<void>;
  override run(cb: ICallback): void;
  override run(cb?: ICallback): Promise<void> | void {
    withOptionalCallback(cb, (callback) => {
      this.logger.debug(`Attempting to run RedisLock for key: ${this.lockKey}`);

      super.run((err) => {
        if (err instanceof LockNotAcquiredError) {
          this.logger.debug(
            `Lock already held by another instance for key: ${this.lockKey}`,
          );
          return callback(err);
        }

        if (err) {
          this.logger.error(`Error running RedisLock: ${err.message}`, err);
          return callback(err);
        }

        this.logger.debug(
          `RedisLock running successfully for key: ${this.lockKey}`,
        );

        callback(null);
      });
    });
  }

  acquireLock(cb: ICallback): void {
    this.logger.debug(`Acquiring lock for key: ${this.lockKey}`);
    this.run(cb);
  }

  releaseLock(cb: ICallback): void {
    this.logger.debug(`Releasing lock for key: ${this.lockKey}`);
    this.shutdown(cb);
  }

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

  isLocked(): boolean {
    const locked = this.lifecycle.isRunning();
    this.logger.debug(
      `Lock status check for key ${this.lockKey}: ${locked ? 'locked' : 'not locked'}`,
    );
    return locked;
  }

  isReleased(): boolean {
    const released = this.lifecycle.isDown();
    this.logger.debug(
      `Lock release status check for key ${this.lockKey}: ${released ? 'released' : 'not released'}`,
    );
    return released;
  }

  getRetryAttempts(): number {
    return this.backoff?.getAttempts() ?? 0;
  }
}
