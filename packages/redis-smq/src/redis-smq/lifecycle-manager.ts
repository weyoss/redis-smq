/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisConfig, PanicError } from 'redis-smq-common';
import { IRedisSMQConfig } from '../config-manager/index.js';
import { Configuration } from '../config-manager/configuration.js';
import { RedisConnectionPool } from '../common/redis/redis-connection-pool/redis-connection-pool.js';
import { InternalEventBus } from '../event-bus/internal-event-bus.js';
import { BackgroundJobCluster } from '../common/background-jobs/background-job-cluster.js';
import { StateManager } from './state-manager.js';
import { ComponentRegistry } from './component-registry.js';
import { EventBus } from '../event-bus/index.js';
import { parseRedisConfig } from '../config-manager/parse-redis-config.js';
import { EventMultiplexer } from '../event-bus/event-multiplexer.js';
import { ConfigSync } from '../config-manager/config-sync.js';

export class LifecycleManager {
  // Waiters for shutdown (when multiple calls to shut down happen)
  static shutdownWaiters: ICallback[] = [];

  // Waiters for initialization (when multiple calls to initialize happen)
  static initWaiters: ICallback[] = [];

  private static bootstrap(redisConfig: IRedisConfig, cb: ICallback): void;
  private static bootstrap(
    redisConfig: IRedisConfig,
    redisSMQConfig: IRedisSMQConfig,
    cb: ICallback,
  ): void;
  private static bootstrap(
    redisConfig: IRedisConfig,
    redisSMQConfig: IRedisSMQConfig | ICallback,
    cb?: ICallback,
  ): void {
    const callback = cb ?? redisSMQConfig;
    if (typeof callback !== 'function') {
      throw new Error('Invalid arguments: a callback function is required');
    }

    async.series(
      [
        (cb) =>
          RedisConnectionPool.initialize(redisConfig, {}, (err) => cb(err)),
        (cb) => {
          if (typeof redisSMQConfig === 'function')
            return Configuration.initialize(cb);
          Configuration.initializeWithConfig(redisSMQConfig, cb);
        },
        (cb) => InternalEventBus.getInstance().run(cb),
        (cb) => ConfigSync.initialize(cb),
        (cb) => BackgroundJobCluster.run(cb),
        (cb) => {
          const config = Configuration.getConfig();
          if (config.eventBus.enabled) {
            return EventBus.getInstance().run(cb);
          }
          cb();
        },
      ],
      (err) => callback(err),
    );
  }

  private static initInternal(
    resolveConfig: () => {
      redisConfig: IRedisConfig;
      redisSMQConfig?: IRedisSMQConfig;
    },
    cb: ICallback,
  ): void {
    if (StateManager.isUp()) {
      return cb();
    }

    if (StateManager.isGoingUp()) {
      LifecycleManager.initWaiters.push(cb);
      return;
    }

    if (StateManager.isGoingDown()) {
      return cb(new PanicError({ message: 'RedisSMQ is shutting down' }));
    }

    try {
      const { redisSMQConfig, redisConfig } = resolveConfig();
      StateManager.goingUp();
      if (redisSMQConfig) {
        LifecycleManager.bootstrap(redisConfig, redisSMQConfig, (err) =>
          LifecycleManager.finishInitialization(err, cb),
        );
      } else {
        LifecycleManager.bootstrap(redisConfig, (err) =>
          LifecycleManager.finishInitialization(err, cb),
        );
      }
    } catch (e: unknown) {
      const err =
        e instanceof Error
          ? e
          : new PanicError({
              message: String(e),
            });
      return cb(err);
    }
  }

  private static finishInitialization(
    err: Error | null | undefined,
    cb: ICallback,
  ) {
    if (err) StateManager.rollback();
    else StateManager.commit();
    const waiters = LifecycleManager.initWaiters.splice(0);
    cb(err);
    waiters.forEach((w) => w(err));
  }

  /**
   * Checks if RedisSMQ has been initialized.
   *
   * @returns True if initialized, false otherwise
   *
   * @example
   * ```typescript
   * if (RedisSMQ.isInitialized()) {
   *   console.log('RedisSMQ is ready to use');
   * } else {
   *   console.log('RedisSMQ not initialized yet');
   * }
   *
   * // Use in conditional logic
   * if (!RedisSMQ.isInitialized()) {
   *   await RedisSMQ.initialize({ host: 'localhost', port: 6379 });
   * }
   * ```
   */
  static isInitialized = (): boolean => {
    return StateManager.isRunning();
  };

  /**
   * Initializes RedisSMQ with Redis connection settings.
   * This is the simplest way to get started - just provide Redis connection once.
   *
   * @param redisConfig - Redis connection configuration
   * @param cb - Optional callback function called when initialization completes
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * import { RedisSMQ } from 'redis-smq';
   * import { ERedisConfigClient } from 'redis-smq-common';
   *
   * // Callback pattern
   * RedisSMQ.initialize({
   *   client: ERedisConfigClient.IOREDIS,
   *   options: {
   *     host: 'localhost',
   *     port: 6379,
   *     db: 0
   *   }
   * }, (err) => {
   *   if (err) {
   *     console.error('Failed to initialize:', err);
   *     return;
   *   }
   *   console.log('RedisSMQ initialized successfully');
   * });
   *
   * // Promise pattern
   * try {
   *   await RedisSMQ.initialize({
   *     client: ERedisConfigClient.IOREDIS,
   *     options: { host: 'localhost', port: 6379 }
   *   });
   *   console.log('RedisSMQ initialized successfully');
   * } catch (err) {
   *   console.error('Failed to initialize:', err);
   * }
   * ```
   */
  static initialize(redisConfig: IRedisConfig): Promise<void>;
  static initialize(redisConfig: IRedisConfig, cb: ICallback): void;
  static initialize(
    redisConfig: IRedisConfig,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      LifecycleManager.initInternal(() => ({ redisConfig }), callback);
    });
  }

  /**
   * Initializes RedisSMQ with custom RedisSMQ configuration.
   * This method allows you to provide a complete RedisSMQ configuration that will be saved to Redis.
   * The Redis connection configuration is extracted from the provided RedisSMQ configuration.
   *
   * @param redisSMQConfig - Complete RedisSMQ configuration including Redis settings
   * @param cb - Optional callback function called when initialization completes
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * import { RedisSMQ } from 'redis-smq';
   * import { ERedisConfigClient } from 'redis-smq-common';
   *
   * // Callback pattern
   * RedisSMQ.initializeWithConfig({
   *   namespace: 'my-custom-app',
   *   redis: {
   *     client: ERedisConfigClient.IOREDIS,
   *     options: { host: 'localhost', port: 6379 }
   *   },
   *   logger: { enabled: true },
   *   eventBus: { enabled: true }
   * }, (err) => {
   *   if (err) {
   *     console.error('Failed to initialize:', err);
   *   } else {
   *     console.log('Initialized with custom config');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await RedisSMQ.initializeWithConfig({
   *     namespace: 'production',
   *     redis: {
   *       client: ERedisConfigClient.IOREDIS,
   *       options: { host: 'redis.example.com', port: 6379 }
   *     }
   *   });
   *   console.log('RedisSMQ initialized with custom config');
   * } catch (err) {
   *   console.error('Failed to initialize:', err);
   * }
   * ```
   */
  static initializeWithConfig(redisSMQConfig: IRedisSMQConfig): Promise<void>;
  static initializeWithConfig(
    redisSMQConfig: IRedisSMQConfig,
    cb: ICallback,
  ): void;
  static initializeWithConfig(
    redisSMQConfig: IRedisSMQConfig,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      LifecycleManager.initInternal(
        () => ({
          redisConfig: parseRedisConfig(redisSMQConfig.redis),
          redisSMQConfig: redisSMQConfig,
        }),
        callback,
      );
    });
  }

  /**
   * Shuts down RedisSMQ and closes shared resources.
   *
   * This convenience method:
   * - Gracefully shuts down the Redis connection pool
   * - Closes the configuration Redis client
   * - Resets RedisSMQ initialization state
   *
   * Note: You should still shutdown any created components (e.g. Producer, Consumer,
   * QueueManagers, MessageManager, etc.) prior to calling this method to ensure all
   * in-flight operations complete and connections are released back to the pool.
   *
   * @param cb - Optional callback invoked when shutdown completes
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * RedisSMQ.shutdown((err) => {
   *   if (err) {
   *     console.error('Shutdown failed:', err);
   *   } else {
   *     console.log('RedisSMQ shut down successfully');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await RedisSMQ.shutdown();
   *   console.log('RedisSMQ shut down successfully');
   * } catch (err) {
   *   console.error('Shutdown failed:', err);
   * }
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

          const waiters = LifecycleManager.shutdownWaiters.splice(0);
          const firstErr = errors[0] || null;
          callback(firstErr);
          waiters.forEach((w) => w(firstErr));
        },
      );
    });
  }

  /**
   * Resets RedisSMQ initialization state.
   * Useful for testing or reconfiguration.
   *
   * @param cb - Optional callback function called when reset completes
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * RedisSMQ.reset((err) => {
   *   if (err) {
   *     console.error('Reset failed:', err);
   *   } else {
   *     console.log('RedisSMQ reset successfully');
   *     // Can now reinitialize with new configuration
   *     RedisSMQ.initialize(newConfig);
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await RedisSMQ.reset();
   *   console.log('RedisSMQ reset successfully');
   *   // Reinitialize with new configuration
   *   await RedisSMQ.initialize(newConfig);
   * } catch (err) {
   *   console.error('Reset failed:', err);
   * }
   * ```
   */
  static reset(): Promise<void>;
  static reset(cb: ICallback): void;
  static reset(cb?: ICallback): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      if (StateManager.isDown() && ComponentRegistry.size === 0) {
        return callback();
      }
      LifecycleManager.shutdown(callback);
    });
  }
}
