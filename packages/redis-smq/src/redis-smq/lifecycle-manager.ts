/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisConfig, PanicError } from 'redis-smq-common';
import { Configuration } from '../config-manager/configuration.js';
import { RedisConnectionPool } from '../common/redis/redis-connection-pool/redis-connection-pool.js';
import { InternalEventBus } from '../event-bus/internal-event-bus.js';
import { BackgroundJobCluster } from '../common/background-jobs/background-job-cluster.js';
import { StateManager } from './state-manager.js';
import { ComponentRegistry } from './component-registry.js';
import { EventBus } from '../event-bus/index.js';
import { EventMultiplexer } from '../event-bus/event-multiplexer.js';
import { ConfigSync } from '../config-manager/config-sync.js';
import { RedisConfig } from '../common/redis/redis-config.js';

/**
 * Manages the lifecycle (initialization and shutdown) of the RedisSMQ system.
 *
 * This class provides a singleton-style interface to control the global state
 * of RedisSMQ, handling resource initialization, connection pooling, event bus
 * setup, and graceful shutdown of all components.
 *
 * The lifecycle state machine includes:
 * - **DOWN**: Not initialized or fully shut down
 * - **GOING_UP**: Initialization in progress
 * - **UP**: Fully initialized and running
 * - **GOING_DOWN**: Shutdown in progress
 *
 * All methods are static to ensure a single, globally accessible lifecycle manager.
 *
 * @example
 * ```typescript
 * import { LifecycleManager } from './lifecycle-manager.js';
 * import { ERedisConfigClient } from 'redis-smq-common';
 *
 * // Initialize with Promise pattern
 * try {
 *   await LifecycleManager.initialize({
 *     client: ERedisConfigClient.IOREDIS,
 *     options: { host: 'localhost', port: 6379 }
 *   });
 *   console.log('RedisSMQ initialized successfully');
 * } catch (err) {
 *   console.error('Initialization failed:', err);
 * }
 *
 * // Shutdown with Promise pattern
 * try {
 *   await LifecycleManager.shutdown();
 *   console.log('RedisSMQ shut down successfully');
 * } catch (err) {
 *   console.error('Shutdown failed:', err);
 * }
 * ```
 *
 * @public
 */
export class LifecycleManager {
  /**
   * Queue of callbacks waiting for shutdown to complete.
   * Used when multiple shutdown calls are made concurrently.
   *
   * @internal
   */
  static shutdownWaiters: ICallback[] = [];

  /**
   * Queue of callbacks waiting for initialization to complete.
   * Used when multiple initialize calls are made concurrently.
   *
   * @internal
   */
  static initWaiters: ICallback[] = [];

  /**
   * Checks whether RedisSMQ is currently running.
   *
   * A running state means the system has been successfully initialized
   * and is ready to handle operations (e.g., producing/consuming messages).
   *
   * @returns `true` if RedisSMQ is fully initialized and running, otherwise `false`
   *
   * @example
   * ```typescript
   * if (LifecycleManager.isRunning()) {
   *   console.log('RedisSMQ is ready');
   * } else {
   *   console.log('RedisSMQ is not initialized');
   * }
   * ```
   */
  static isRunning = (): boolean => {
    return StateManager.isRunning();
  };

  /**
   * Initializes RedisSMQ with optional Redis connection settings.
   *
   * @param redisConfig - Optional Redis connection configuration.
   *                      If not provided, uses default configuration.
   * @param cb - Optional callback function invoked when initialization completes.
   *             The callback receives an error if initialization fails.
   *
   * @returns A Promise that resolves when initialization completes (if no callback provided),
   *          or `void` if a callback is provided
   *
   * @throws {PanicError} Thrown when attempting to initialize while shutting down
   *
   * @example
   * ```typescript
   * // Callback pattern with Redis configuration
   * LifecycleManager.initialize(
   *   {
   *     client: ERedisConfigClient.IOREDIS,
   *     options: {
   *       host: 'localhost',
   *       port: 6379,
   *       db: 0,
   *       password: 'secret'
   *     }
   *   },
   *   (err) => {
   *     if (err) {
   *       console.error('Failed to initialize:', err);
   *       return;
   *     }
   *     console.log('RedisSMQ initialized successfully');
   *   }
   * );
   *
   * // Callback pattern without configuration (uses defaults)
   * LifecycleManager.initialize((err) => {
   *   if (err) console.error(err);
   * });
   *
   * // Promise pattern with configuration
   * try {
   *   await LifecycleManager.initialize({
   *     client: ERedisConfigClient.IOREDIS,
   *     options: { host: 'localhost', port: 6379 }
   *   });
   *   console.log('RedisSMQ initialized successfully');
   * } catch (err) {
   *   console.error('Failed to initialize:', err);
   * }
   *
   * // Promise pattern without configuration
   * await LifecycleManager.initialize();
   * ```
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

    // Parse overloaded arguments
    if (args.length === 1) {
      if (typeof args[0] === 'function') cb = args[0];
      else redisConfig = args[0];
    }

    if (args.length === 2) {
      if (typeof args[0] === 'object') redisConfig = args[0];
      if (typeof args[1] === 'function') cb = args[1];
    }

    return async.withOptionalCallback(cb, (callback) => {
      // Fast path: already running
      if (StateManager.isUp()) {
        return callback();
      }

      // Fast path: initialization in progress, queue this callback
      if (StateManager.isGoingUp()) {
        LifecycleManager.initWaiters.push(callback);
        return;
      }

      // Error path: shutdown in progress
      if (StateManager.isGoingDown()) {
        return callback(
          new PanicError({ message: 'RedisSMQ is shutting down' }),
        );
      }

      // Begin initialization
      StateManager.goingUp();

      // Store the configuration (only first call matters)
      RedisConfig.initialize(redisConfig);

      // Initialize all components in sequence
      async.series(
        [
          (cb) => {
            const config = RedisConfig.getConfig();
            RedisConnectionPool.initialize(config, {}, (err) => cb(err));
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
            BackgroundJobCluster.run(cb);
          },
        ],
        (err) => {
          // Rollback on error, commit on success
          if (err) StateManager.rollback();
          else StateManager.commit();

          // Notify all waiting callbacks
          const waiters = LifecycleManager.initWaiters.splice(0);
          waiters.forEach((w) => w(err));

          // Notify the current callback
          callback(err);
        },
      );
    });
  }

  /**
   * Gracefully shuts down RedisSMQ and releases all shared resources.
   *
   * **Important:**
   * - You should manually shutdown any created components (Producer, Consumer,
   *   QueueManager, MessageManager, etc.) **before** calling this method to ensure
   *   all in-flight operations complete and connections are properly released
   * - If shutdown is already in progress, additional calls are queued
   * - If initialization is in progress, shutdown will fail with an error
   * - If the system is already down and no components are registered, shutdown
   *   completes immediately
   * - Errors during shutdown of individual components are collected but do not
   *   prevent other components from shutting down
   *
   * @param cb - Optional callback function invoked when shutdown completes.
   *             The callback receives the first error encountered during shutdown,
   *             or `null` if shutdown completed successfully.
   *
   * @returns A Promise that resolves when shutdown completes (if no callback provided),
   *          or `void` if a callback is provided
   *
   * @throws {PanicError} Thrown when attempting to shutdown while initialization is in progress
   *
   * @example
   * ```typescript
   * // Callback pattern
   * LifecycleManager.shutdown((err) => {
   *   if (err) {
   *     console.error('Shutdown failed:', err);
   *   } else {
   *     console.log('RedisSMQ shut down successfully');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await LifecycleManager.shutdown();
   *   console.log('RedisSMQ shut down successfully');
   * } catch (err) {
   *   console.error('Shutdown failed:', err);
   * }
   *
   * // Graceful shutdown with component cleanup
   * const producer = await Producer.getInstance();
   * await producer.shutdown(); // Shutdown producer first
   * await LifecycleManager.shutdown(); // Then shutdown the system
   * ```
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

      async.series(
        [
          (cb) => BackgroundJobCluster.shutdown(cb),
          (cb) =>
            ComponentRegistry.shutdownComponents((err) => {
              if (err) errors.push(err);
              cb();
            }),
          (cb) => ConfigSync.shutdown(cb),
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
            RedisConnectionPool.shutdown((err) => {
              if (err) errors.push(err);
              cb();
            }),
        ],
        () => {
          StateManager.commit();
          ComponentRegistry.clear();
          RedisConfig.reset();

          const waiters = LifecycleManager.shutdownWaiters.splice(0);
          const firstErr = errors[0] || null;
          callback(firstErr);
          waiters.forEach((w) => w(firstErr));
        },
      );
    });
  }
}
