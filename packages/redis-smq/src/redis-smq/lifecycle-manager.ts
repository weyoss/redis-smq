/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  ICallback,
  IRedisConfig,
  Lifecycle,
  PanicError,
} from 'redis-smq-common';
import { Configuration } from '../core/config-manager/configuration.js';
import { Pool } from '../core/common/redis/connection-pool/pool.js';
import { InternalEventBus } from '../core/event-bus/internal-event-bus.js';
import { Cluster } from '../core/common/background-jobs/cluster.js';
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
 * ## Lifecycle contract
 *
 * - `initialize()` is transactional. On any failure (synchronous or
 *   asynchronous), every resource created during the attempt is torn down
 *   in reverse order, and the state machine is returned to DOWN, so a
 *   subsequent `initialize()` can be retried.
 * - All synchronous throws from singleton re-init guards are caught and
 *   routed through the same failure path as asynchronous errors.
 * - Waiters queued behind an in-flight transition are drained and isolated,
 *   so a single throwing callback cannot block the others.
 *
 * ## State machine
 *
 * The four states — DOWN / GOING_UP / UP / GOING_DOWN — are provided by
 * `Lifecycle` from `redis-smq-common`. This class owns the single
 * `Lifecycle` instance that represents the library's lifecycle. See
 * `Lifecycle`'s documentation for transition rules, return-value contract,
 * and the rollback asymmetry (startup is retryable via `rollback()`;
 * shutdown is one-way — only `commit()`).
 *
 * The `lifecycle` field is not exposed. External callers use
 * `LifecycleManager.isRunning()` (or `RedisSMQ.isRunning()`), which
 * delegate here.
 */
export class LifecycleManager {
  /**
   * The library's lifecycle state machine. One instance, shared by every
   * `LifecycleManager` static — matches the "one library, one lifecycle"
   * model.
   *
   * Replaces the previous `StateManager` class, which was a thin static
   * wrapper around the same `Lifecycle` instance with no additional logic.
   * Inlining it here removes an indirection layer and makes the state
   * transitions explicit at the call sites that manage them.
   */
  private static readonly lifecycle = new Lifecycle();

  /** @internal */
  private static shutdownWaiters: ICallback[] = [];

  /** @internal */
  private static initWaiters: ICallback[] = [];

  /**
   * Checks if RedisSMQ is currently running.
   *
   * Returns `true` only in the `UP` state — fully initialized, no
   * transition in flight. Distinct from `Lifecycle.isUp()`, which also
   * returns `true` during `GOING_DOWN` — "running" here means "up and
   * stable," not "committed to up."
   *
   * @returns true if fully initialized and running
   */
  static isRunning = (): boolean => {
    return LifecycleManager.lifecycle.isRunning();
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
      // ── State guards ────────────────────────────────────────────────
      // Order matters: `isRunning()` (UP only) is checked first, so a
      // call during `GOING_DOWN` falls through to the `isGoingDown()`
      // check below and returns PanicError — correct semantics for
      // "cannot initialize during shutdown."
      //
      // Using `isUp()` here would be a bug: `isUp()` returns `true` for
      // both `UP` and `GOING_DOWN`, so the `isGoingDown()` branch would
      // be unreachable, and initialize-during-shutdown would return
      // success while resources are being torn down.
      if (LifecycleManager.lifecycle.isRunning()) {
        return callback();
      }

      if (LifecycleManager.lifecycle.isGoingUp()) {
        LifecycleManager.initWaiters.push(callback);
        return;
      }

      if (LifecycleManager.lifecycle.isGoingDown()) {
        return callback(
          new PanicError({ message: 'RedisSMQ is shutting down' }),
        );
      }

      // State is DOWN. The transition to GOING_UP cannot fail from here.
      LifecycleManager.lifecycle.goingUp();

      // ── Synchronous bootstrap ───────────────────────────────────────
      // Config.initialize() throws synchronously if the singleton is
      // already set (retry after a failed attempt). This throw must not
      // escape without rolling back the state machine, otherwise the
      // process becomes permanently bricked: subsequent initialize()
      // calls would queue forever and shutdown() would be rejected.
      try {
        Config.initialize(redisConfig);
      } catch (err) {
        return LifecycleManager.failInitialize(
          err instanceof Error ? err : new Error(String(err)),
          callback,
        );
      }

      // ── Asynchronous bootstrap ──────────────────────────────────────
      // The series is expected to short-circuit on the first error. Any
      // resources created by earlier steps are cleaned up by
      // failInitialize() -> rollbackResources().
      async.series(
        [
          (cb: ICallback) => {
            // Guarded because Pool.initialize() throws synchronously if
            // the singleton is already set.
            try {
              const config = Config.getConfig();
              Pool.initialize(config, {}, (err) => cb(err));
            } catch (err) {
              cb(err instanceof Error ? err : new Error(String(err)));
            }
          },
          (cb: ICallback) => {
            Configuration.initialize(cb);
          },
          (cb: ICallback) => {
            InternalEventBus.getInstance().run(cb);
          },
          (cb: ICallback) => {
            ConfigSync.initialize(cb);
          },
          (cb: ICallback) => {
            Cluster.run(cb);
          },
        ],
        (err) => {
          if (err) {
            return LifecycleManager.failInitialize(err, callback);
          }
          LifecycleManager.lifecycle.commit();
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
      // ── State guards ────────────────────────────────────────────────
      // A second shutdown during GOING_DOWN queues behind the first.
      if (LifecycleManager.lifecycle.isGoingDown()) {
        LifecycleManager.shutdownWaiters.push(callback);
        return;
      }

      if (LifecycleManager.lifecycle.isGoingUp()) {
        return callback(
          new PanicError({ message: 'Cannot shutdown while initializing' }),
        );
      }

      if (LifecycleManager.lifecycle.isDown() && ComponentRegistry.size === 0) {
        return callback();
      }

      // State is UP (or DOWN with leftover components). Transition to
      // GOING_DOWN; the transition cannot fail from either state.
      LifecycleManager.lifecycle.goingDown();
      const errors: Error[] = [];

      // Every step is wrapped to push its error and call cb() with no
      // arguments. This guarantees the series never short-circuits, so a
      // single failing teardown cannot leave later resources un-shutdown.
      async.series(
        [
          (cb: ICallback) =>
            Cluster.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb: ICallback) =>
            ComponentRegistry.shutdownComponents((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb: ICallback) =>
            ConfigSync.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb: ICallback) =>
            Configuration.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb: ICallback) =>
            EventBus.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb: ICallback) =>
            InternalEventBus.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb: ICallback) =>
            EventMultiplexer.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb: ICallback) =>
            Pool.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
        ],
        () => {
          LifecycleManager.lifecycle.commit();
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

      LifecycleManager.lifecycle.rollback();
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
        (d: ICallback) =>
          Cluster.shutdown((err) => {
            if (err) errors.push(err);
            d();
          }),
        (d: ICallback) =>
          ConfigSync.shutdown((err) => {
            if (err) errors.push(err);
            d();
          }),
        (d: ICallback) =>
          InternalEventBus.shutdown((err) => {
            if (err) errors.push(err);
            d();
          }),
        (d: ICallback) =>
          Configuration.shutdown((err) => {
            if (err) errors.push(err);
            d();
          }),
        (d: ICallback) =>
          Pool.shutdown((err) => {
            if (err) errors.push(err);
            d();
          }),
        (d: ICallback) => {
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
