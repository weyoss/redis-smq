/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisConfig, PanicError } from 'redis-smq-common';
import { Configuration, IRedisSMQConfig } from '../config/index.js';
import { RedisConnectionPool } from '../common/redis/redis-connection-pool/redis-connection-pool.js';
import { InternalEventBus } from '../event-bus/internal-event-bus.js';
import { BackgroundJobCluster } from './background-jobs/background-job-cluster.js';
import { StateManager } from './state-manager.js';
import { ComponentRegistry } from './component-registry.js';
import { EventBus } from '../event-bus/index.js';
import { parseRedisConfig } from '../config/parse-redis-config.js';
import { EventMultiplexer } from '../event-bus/event-multiplexer.js';

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
      this.initWaiters.push(cb);
      return;
    }

    if (StateManager.isGoingDown()) {
      return cb(new PanicError({ message: 'RedisSMQ is shutting down' }));
    }

    try {
      const { redisSMQConfig, redisConfig } = resolveConfig();
      StateManager.goingUp();
      if (redisSMQConfig) {
        this.bootstrap(redisConfig, redisSMQConfig, (err) =>
          this.finishInitialization(err, cb),
        );
      } else {
        this.bootstrap(redisConfig, (err) =>
          this.finishInitialization(err, cb),
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
    const waiters = this.initWaiters.splice(0);
    cb(err);
    waiters.forEach((w) => w(err));
  }

  /**
   * Checks if RedisSMQ has been initialized.
   *
   * @returns True if initialized, false otherwise
   */
  static isInitialized = (): boolean => {
    return StateManager.isRunning();
  };

  /**
   * Initializes RedisSMQ with Redis connection settings.
   * This is the simplest way to get started - just provide Redis connection once.
   *
   * @param redisConfig - Redis connection configuration
   * @param cb - Callback function called when initialization completes
   *
   * @example
   * ```typescript
   * import { RedisSMQ } from 'redis-smq';
   * import { ERedisConfigClient } from 'redis-smq-common';
   *
   * RedisSMQ.initialize({
   *   client: ERedisConfigClient.IOREDIS,
   *   options: {
   *     host: 'localhost',
   *     port: 6379,
   *     db: 0
   *   }
   * }, (err) => {
   *   if (err) {
   *     console.error('Failed to initialize RedisSMQ:', err);
   *     return;
   *   }
   *   console.log('RedisSMQ initialized successfully');
   *
   *   // Now you can create producers and consumers without Redis config!
   *   const producer = RedisSMQ.createProducer();
   *   const consumer = RedisSMQ.createConsumer();
   *
   *   producer.run((e) => {
   *     if (e) return console.error('Producer failed to start:', e);
   *     console.log('Producer ready');
   *   });
   *
   *   consumer.run((e) => {
   *     if (e) return console.error('Consumer failed to start:', e);
   *     console.log('Consumer ready');
   *   });
   * });
   * ```
   */
  static initialize = (redisConfig: IRedisConfig, cb: ICallback): void => {
    this.initInternal(() => ({ redisConfig }), cb);
  };

  /**
   * Initializes RedisSMQ with custom RedisSMQ configuration.
   * This method allows you to provide a complete RedisSMQ configuration that will be saved to Redis.
   * The Redis connection configuration is extracted from the provided RedisSMQ configuration.
   *
   * @param redisSMQConfig - Complete RedisSMQ configuration including Redis settings
   * @param cb - Callback function called when initialization completes
   *
   * @example
   * ```typescript
   * import { RedisSMQ } from 'redis-smq';
   * import { ERedisConfigClient } from 'redis-smq-common';
   *
   * RedisSMQ.initializeWithConfig({
   *   namespace: 'my-custom-app',
   *   redis: {
   *     client: ERedisConfigClient.IOREDIS,
   *     options: {
   *       host: 'localhost',
   *       port: 6379,
   *       db: 0
   *     }
   *   },
   *   logger: {
   *     enabled: true
   *   },
   *   eventBus: { enabled: true }
   * }, (err) => {
   *   if (err) {
   *     console.error('Failed to initialize RedisSMQ:', err);
   *   } else {
   *     console.log('RedisSMQ initialized with custom configuration');
   *   }
   * });
   * ```
   */
  static initializeWithConfig = (
    redisSMQConfig: IRedisSMQConfig,
    cb: ICallback,
  ): void => {
    this.initInternal(
      () => ({
        redisConfig: parseRedisConfig(redisSMQConfig.redis),
        redisSMQConfig: redisSMQConfig,
      }),
      cb,
    );
  };

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
   * @param cb - Callback invoked when shutdown completes
   */
  static shutdown = (cb: ICallback): void => {
    if (StateManager.isGoingDown()) {
      this.shutdownWaiters.push(cb);
      return;
    }

    if (StateManager.isGoingUp()) {
      return cb(
        new PanicError({ message: 'Cannot shutdown while initializing' }),
      );
    }

    if (StateManager.isDown() && ComponentRegistry.size === 0) {
      return cb();
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
        (cb) =>
          RedisConnectionPool.shutdown((err) => {
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
      ],
      () => {
        StateManager.commit();
        ComponentRegistry.clear();

        const waiters = this.shutdownWaiters.splice(0);
        const firstErr = errors[0] || null;
        cb(firstErr);
        waiters.forEach((w) => w(firstErr));
      },
    );
  };

  /**
   * Resets RedisSMQ initialization state.
   * Useful for testing or reconfiguration.
   */
  static reset = (cb: ICallback = () => void 0): void => {
    if (StateManager.isDown() && ComponentRegistry.size === 0) {
      return cb();
    }
    this.shutdown(cb);
  };
}
