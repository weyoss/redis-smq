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
 * Manages RedisSMQ system lifecycle (initialization and shutdown).
 *
 * Handles resource initialization, connection pooling, event bus setup,
 * and graceful shutdown of all components.
 */
export class LifecycleManager {
  /** @internal */
  static shutdownWaiters: ICallback[] = [];

  /** @internal */
  static initWaiters: ICallback[] = [];

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

      RedisConfig.initialize(redisConfig);

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
          if (err) StateManager.rollback();
          else StateManager.commit();

          const waiters = LifecycleManager.initWaiters.splice(0);
          waiters.forEach((w) => w(err));

          callback(err);
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
