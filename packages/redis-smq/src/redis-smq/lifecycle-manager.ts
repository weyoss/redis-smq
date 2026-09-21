/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisConfig, PanicError } from 'redis-smq-common';
import { Configuration } from '../core/config-manager/configuration.js';
import { Pool } from '../core/common/redis/connection-pool/pool.js';
import { InternalEventBus } from '../core/event-bus/internal-event-bus.js';
import { Cluster } from '../core/common/background-jobs/cluster.js';
import { StateManager } from './state-manager.js';
import { ComponentRegistry } from './component-registry.js';
import { EventBus } from '../core/event-bus/index.js';
import { EventMultiplexer } from '../core/event-bus/event-multiplexer.js';
import { ConfigSync } from '../core/config-manager/config-sync.js';
import { Config } from '../core/common/redis/config.js';

/**
 * Manages RedisSMQ system lifecycle (initialization and shutdown).
 *
 * Handles resource initialization, connection pooling, event bus setup,
 * and graceful shutdown of all components.
 *
 * Lifecycle contract:
 * - `initialize()` is transactional. On any failure (synchronous or
 *   asynchronous), every resource created during the attempt is torn down
 *   in reverse order, and the state machine is returned to DOWN, so a
 *   subsequent `initialize()` can be retried.
 * - All synchronous throws from singleton re-init guards are caught and
 *   routed through the same failure path as asynchronous errors.
 * - Waiters queued behind an in-flight transition are drained and isolated,
 *   so a single throwing callback cannot block the others.
 */
export class LifecycleManager {
  /** @internal */
  private static shutdownWaiters: ICallback[] = [];

  /** @internal */
  private static initWaiters: ICallback[] = [];

  /**
   * Checks if RedisSMQ is currently running.
   *
   * @returns true if initialized and running
   */
  static isRunning = (): boolean => {
    return StateManager.isRunning();
  };

  /**
   * Initializes RedisSMQ.
   *
   * @param redisConfig - Optional Redis configuration
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   */
  static initialize(): Promise<void>;
  static initialize(cb: ICallback): void;
  static initialize(redisConfig: IRedisConfig): Promise<void>;
  static initialize(redisConfig: IRedisConfig, cb: ICallback): void;
  static initialize(
    ...args: [ICallback | IRedisConfig] | [IRedisConfig, ICallback] | []
  ): Promise<void> | void {
    let cb: ICallback | undefined = undefined;
    let redisConfig: IRedisConfig | undefined = undefined;

    if (args.length === 1) {
      if (typeof args[0] === 'function') cb = args[0];
      else redisConfig = args[0];
    }

    if (args.length === 2) {
      if (typeof args[0] === 'object') redisConfig = args[0];
      if (typeof args[1] === 'function') cb = args[1];
    }

    return async.withOptionalCallback(cb, (callback) => {
      if (StateManager.isUp()) {
        return callback();
      }

      if (StateManager.isGoingUp()) {
        LifecycleManager.initWaiters.push(callback);
        return;
      }

      if (StateManager.isGoingDown()) {
        return callback(
          new PanicError({ message: 'RedisSMQ is shutting down' }),
        );
      }

      StateManager.goingUp();

      // ── Synchronous bootstrap ─────────────────────────────────────────
      // Config.initialize() throws synchronously if the singleton is
      // already set (retry after a failed attempt). This throw must not
      // escape without rolling back the state machine, otherwise the
      // process becomes permanently bricked: subsequent initialize() calls
      // would queue forever and shutdown() would be rejected.
      try {
        Config.initialize(redisConfig);
      } catch (err) {
        return LifecycleManager.failInitialize(
          err instanceof Error ? err : new Error(String(err)),
          callback,
        );
      }

      // ── Asynchronous bootstrap ────────────────────────────────────────
      // The series is expected to short-circuit on the first error. Any
      // resources created by earlier steps are cleaned up by
      // failInitialize() -> rollbackResources().
      async.series(
        [
          (cb) => {
            // Guarded because Pool.initialize() throws
            // synchronously if the singleton is already set.
            try {
              const config = Config.getConfig();
              Pool.initialize(config, {}, (err) => cb(err));
            } catch (err) {
              cb(err instanceof Error ? err : new Error(String(err)));
            }
          },
          (cb) => {
            Configuration.initialize(cb);
          },
          (cb) => {
            InternalEventBus.getInstance().run(cb);
          },
          (cb) => {
            ConfigSync.initialize(cb);
          },
          (cb) => {
            Cluster.run(cb);
          },
        ],
        (err) => {
          if (err) {
            return LifecycleManager.failInitialize(err, callback);
          }
          StateManager.commit();
          LifecycleManager.settleSuccess(callback);
        },
      );
    });
  }

  /**
   * Gracefully shuts down RedisSMQ.
   *
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   */
  static shutdown(): Promise<void>;
  static shutdown(cb: ICallback): void;
  static shutdown(cb?: ICallback): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      if (StateManager.isGoingDown()) {
        LifecycleManager.shutdownWaiters.push(callback);
        return;
      }

      if (StateManager.isGoingUp()) {
        return callback(
          new PanicError({ message: 'Cannot shutdown while initializing' }),
        );
      }

      if (StateManager.isDown() && ComponentRegistry.size === 0) {
        return callback();
      }

      StateManager.goingDown();
      const errors: Error[] = [];

      // Every step is wrapped to push its error and call cb() with no
      // arguments. This guarantees the series never short-circuits, so a
      // single failing teardown cannot leave later resources un-shutdown.
      async.series(
        [
          (cb) =>
            Cluster.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb) =>
            ComponentRegistry.shutdownComponents((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb) =>
            ConfigSync.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb) =>
            Configuration.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb) =>
            EventBus.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb) =>
            InternalEventBus.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb) =>
            EventMultiplexer.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb) =>
            Pool.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
        ],
        () => {
          StateManager.commit();
          ComponentRegistry.clear();
          Config.reset();

          const firstErr = errors[0] || null;

          // Waiters first (isolated), then the primary callback. If a
          // waiter throws, the others and the primary caller are still
          // notified. Ordering is the same as in the success path.
          const waiters = LifecycleManager.shutdownWaiters.splice(0);
          waiters.forEach((w) => {
            try {
              w(firstErr);
            } catch {
              /* isolate: one bad waiter must not block the others */
            }
          });

          callback(firstErr);
        },
      );
    });
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  /**
   * Roll back a failed initialization attempt:
   *   1. Tear down any resources created during the attempt (reverse order).
   *   2. Roll back the state machine to DOWN.
   *   3. Drain waiters (isolated), then fire the primary callback.
   *
   * Teardown is best-effort: secondary failures during rollback are logged
   * but do not mask the original initialization error.
   */
  private static failInitialize(err: Error, callback: ICallback): void {
    LifecycleManager.rollbackResources((rollbackErr) => {
      if (rollbackErr) {
        // Diagnostics only - the caller cares about the original error,
        // not about why cleanup of a half-started system also failed.
        // console.error('rollback after failed initialize:', rollbackErr);
      }

      StateManager.rollback();
      ComponentRegistry.clear();

      const waiters = LifecycleManager.initWaiters.splice(0);
      waiters.forEach((w) => {
        try {
          w(err);
        } catch {
          /* isolate */
        }
      });

      callback(err);
    });
  }

  /**
   * Best-effort teardown of resources that may or may not have been created
   * during a failed initialize(). Every step is wrapped so that a single
   * failing shutdown cannot prevent the remaining steps from running.
   * Order is the reverse of initialization order.
   *
   * Each shutdown() implementation is expected to gracefully no-op when its
   * target was never initialized (which is the case for all of them at
   * present: they guard on `if (instance)` internally).
   */
  private static rollbackResources(cb: ICallback): void {
    const errors: Error[] = [];
    async.series(
      [
        (d) =>
          Cluster.shutdown((err) => {
            if (err) errors.push(err);
            d();
          }),
        (d) =>
          ConfigSync.shutdown((err) => {
            if (err) errors.push(err);
            d();
          }),
        (d) =>
          InternalEventBus.shutdown((err) => {
            if (err) errors.push(err);
            d();
          }),
        (d) =>
          Configuration.shutdown((err) => {
            if (err) errors.push(err);
            d();
          }),
        (d) =>
          Pool.shutdown((err) => {
            if (err) errors.push(err);
            d();
          }),
        (d) => {
          Config.reset();
          d();
        },
      ],
      () => cb(errors[0]),
    );
  }

  /**
   * Notify waiters (isolated) and the primary caller that initialization
   * succeeded. Using the same waiters-first ordering as failInitialize()
   * and shutdown() so the sequence is predictable across all paths.
   */
  private static settleSuccess(callback: ICallback): void {
    const waiters = LifecycleManager.initWaiters.splice(0);
    waiters.forEach((w) => {
      try {
        w();
      } catch {
        /* isolate */
      }
    });

    callback();
  }
}
