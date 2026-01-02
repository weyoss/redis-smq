/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  ICallback,
  OperationNotAllowedError,
  PanicError,
  PowerSwitch,
} from 'redis-smq-common';
import { IRedisSMQConfig, IRedisSMQParsedConfig } from './types/index.js';
import { ConfigurationNotFoundError } from '../errors/configuration-not-found.error.js';
import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import { parseConfig } from './parse-config.js';
import { defaultConfig } from './default-config.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import {
  ConfigurationUpdateError,
  InvalidConfigurationError,
} from '../errors/index.js';

/**
 * Configuration class for managing and setting up the RedisSMQ message queue.
 *
 * This class provides a centralized way to manage RedisSMQ configuration with Redis persistence.
 * It follows the singleton pattern to ensure consistent configuration across the application.
 *
 * Features:
 * - Persistent configuration storage in Redis
 * - Automatic configuration loading and saving
 * - Configuration validation and parsing
 *
 * @example
 * ```typescript
 * // Initialize configuration
 * Configuration.initialize((err) => {
 *   if (err) {
 *     console.error('Failed to initialize configuration:', err);
 *     return;
 *   }
 *
 *   // Get configuration instance
 *   const config = Configuration.getInstance();
 *   const currentConfig = config.getConfig();
 *
 *   // Update configuration
 *   config.updateConfig({ logger: { enabled: false } }, (err) => {
 *     if (!err) console.log('Configuration updated');
 *   });
 * });
 * ```
 */
export class Configuration {
  /** The singleton instance of the Configuration class */
  protected static instance: Configuration | null = null;

  /** Current initialization state */
  protected static state = new PowerSwitch();

  /** Queue of callbacks waiting for initialization to complete */
  protected static initializationQueue: Array<ICallback> = [];

  /** Lock for preventing concurrent instance operations */
  protected operationInProgress = false;

  /** Queue of pending operations to run serially */
  protected operationQueue: Array<() => void> = [];

  /** Callbacks waiting for operation completion (for shutdown) */
  protected completionWaiters: Array<ICallback> = [];

  /**
   * The parsed and validated configuration object stored in-memory.
   * Initialized with defaultConfig until a successful load/save occurs.
   */
  protected config: IRedisSMQParsedConfig = defaultConfig;

  /**
   * Creates a new Configuration instance.
   *
   * This constructor is protected to enforce the singleton pattern.
   * Use the static `initialize` method to create and configure the instance.
   */
  protected constructor() {}

  private static validateInitializationState(cb: ICallback): boolean {
    if (Configuration.state.isUp()) {
      cb(
        new OperationNotAllowedError({
          message: 'Configuration already initialized',
        }),
      );
      return false;
    }

    if (Configuration.state.isGoingUp()) {
      Configuration.initializationQueue.push(cb);
      return false;
    }

    if (Configuration.state.isGoingDown()) {
      cb(
        new OperationNotAllowedError({
          message: 'Configuration is shutting down. Cannot initialize.',
        }),
      );
      return false;
    }

    return true;
  }

  private static completeInitialization(
    error: Error | null | undefined,
    cb: ICallback,
  ): void {
    if (error) {
      Configuration.state.rollback();
      Configuration.instance = null;
    } else {
      Configuration.state.commit();
    }

    const queuedCallbacks = Configuration.initializationQueue.splice(0);
    cb(error);
    queuedCallbacks.forEach((queuedCb) => queuedCb(error));
  }

  private static performInitialization(
    initializationFn: (instance: Configuration, cb: ICallback) => void,
    cb: ICallback,
  ): void {
    if (!Configuration.validateInitializationState(cb)) {
      return;
    }

    Configuration.state.goingUp();
    const instance = (Configuration.instance = new Configuration());

    initializationFn(instance, (err) => {
      Configuration.completeInitialization(err, cb);
    });
  }

  /**
   * Gets the already-initialized singleton instance of Configuration.
   *
   * @returns The Configuration instance
   * @throws OperationNotAllowedError When the configuration has not been initialized
   * @throws PanicError
   *
   * @example
   * ```typescript
   * try {
   *   const config = Configuration.getInstance();
   *   console.log('Configuration is ready');
   * } catch (err) {
   *   console.error('Configuration not initialized:', err.message);
   * }
   * ```
   */
  static getInstance(): Configuration {
    if (Configuration.state.isDown()) {
      throw new OperationNotAllowedError({
        message: 'Configuration not initialized. Call initialize() first.',
      });
    }

    if (Configuration.state.isGoingUp()) {
      throw new OperationNotAllowedError({
        message:
          'Configuration is currently initializing. Please wait for initialization to complete.',
      });
    }

    if (Configuration.state.isGoingDown()) {
      throw new OperationNotAllowedError({
        message: 'Configuration is shutting down. Cannot access instance.',
      });
    }

    if (!Configuration.instance) {
      throw new PanicError({
        message: 'Configuration instance is null despite being initialized',
      });
    }

    return Configuration.instance;
  }

  /**
   * Convenience accessor that returns the current parsed configuration
   * from the singleton instance.
   *
   * Equivalent to Configuration.getInstance().getConfig().
   *
   * @returns The current parsed configuration
   * @throws OperationNotAllowedError When the configuration has not been initialized
   * @throws PanicError
   *
   * @example
   * ```typescript
   * const config = Configuration.getConfig();
   * console.log('Redis host:', config.redis.options.host);
   * ```
   */
  static getConfig(): IRedisSMQParsedConfig {
    return Configuration.getInstance().getConfig();
  }

  /**
   * Initializes the Configuration singleton.
   *
   * This method attempts to load existing configuration from Redis. If no configuration
   * is found, it creates and saves a default configuration. This ensures that the
   * configuration is always persisted and available for subsequent application starts.
   *
   * @param cb - Callback function called when initialization completes
   *
   * @example
   * ```typescript
   * Configuration.initialize((err) => {
   *   if (err) {
   *     console.error('Configuration initialization failed:', err);
   *     return;
   *   }
   *
   *   console.log('Configuration initialized successfully');
   *   const config = Configuration.getConfig();
   * });
   * ```
   */
  static initialize(cb: ICallback): void {
    Configuration.performInitialization((instance, cb) => {
      instance.load((err) => {
        if (err && !(err instanceof ConfigurationNotFoundError)) {
          return cb(err);
        }

        if (err instanceof ConfigurationNotFoundError) {
          instance.saveCurrentConfig(cb);
        } else {
          cb();
        }
      });
    }, cb);
  }

  /**
   * Initializes the Configuration singleton with a specific configuration.
   *
   * This method allows you to initialize the configuration with a custom config object
   * instead of loading from Redis. The provided configuration will be validated, parsed,
   * and saved to Redis for persistence.
   *
   * @param config - Configuration object to initialize with
   * @param cb - Callback function called when initialization completes
   *
   *
   * @example
   * ```typescript
   * const customConfig = {
   *   namespace: 'production',
   *   redis: { options: { host: 'redis.example.com' } },
   *   logger: { enabled: true }
   * };
   *
   * Configuration.initializeWithConfig(customConfig, (err) => {
   *   if (err) {
   *     console.error('Configuration initialization failed:', err);
   *     return;
   *   }
   *
   *   console.log('Configuration initialized with custom config');
   *   const config = Configuration.getConfig();
   * });
   * ```
   */
  static initializeWithConfig(config: IRedisSMQConfig, cb: ICallback): void {
    Configuration.performInitialization((instance, cb) => {
      try {
        instance.config = parseConfig(config);
        instance.saveCurrentConfig(cb);
      } catch (parseErr) {
        const error =
          parseErr instanceof Error
            ? parseErr
            : new InvalidConfigurationError();
        cb(error);
      }
    }, cb);
  }

  /**
   * Shuts down the Configuration singleton and cleans up resources.
   *
   * This method safely shuts down the configuration instance, ensuring that
   * any ongoing operations complete before cleanup. It prevents new operations
   * from starting during shutdown.
   *
   * After calling this method, you can call `initialize` again to create a new
   * configuration instance. This is particularly useful for testing scenarios,
   * application restarts, or when you need to reconfigure the application at runtime.
   *
   * @param cb - Callback function called when the shutdown operation completes.
   *
   * @example
   * ```typescript
   * Configuration.shutdown((err) => {
   *   if (err) {
   *     console.error('Configuration shutdown failed:', err);
   *     return;
   *   }
   *   console.log('Configuration shut down successfully');
   * });
   * ```
   */
  static shutdown(cb: ICallback): void {
    if (Configuration.state.isDown()) {
      return cb();
    }

    if (Configuration.state.isGoingDown()) {
      return cb(
        new OperationNotAllowedError({
          message: 'Configuration is already shutting down',
        }),
      );
    }

    if (Configuration.state.isGoingUp()) {
      return cb(
        new OperationNotAllowedError({
          message: 'Cannot shutdown while initializing',
        }),
      );
    }

    Configuration.state.goingDown();

    if (Configuration.instance) {
      Configuration.instance.waitForOperationCompletion(() => {
        Configuration.instance = null;
        Configuration.state.commit();
        cb();
      });
    } else {
      Configuration.state.commit();
      cb();
    }
  }

  /**
   * Runs a function exclusively with respect to other instance operations.
   * Ensures serialization and guarantees lock release via try/finally.
   * Properly handles both sync and async errors.
   */
  protected runExclusive(fn: (done: ICallback) => void, done: ICallback): void {
    const run = () => {
      this.operationInProgress = true;

      // Execute the operation and always release the lock
      const releaseAndNext = (err?: Error | null) => {
        try {
          done(err);
        } finally {
          this.operationInProgress = false;
          this.notifyCompletionWaiters();
          this.flushOperationQueue();
        }
      };

      try {
        fn(releaseAndNext);
      } catch (e) {
        const err = e instanceof Error ? e : new ConfigurationUpdateError();
        releaseAndNext(err);
      }
    };

    if (this.operationInProgress) {
      this.operationQueue.push(run);
    } else {
      run();
    }
  }

  /**
   * Flushes the next queued operation using setImmediate to avoid deep sync recursion.
   * Processes one operation at a time to maintain proper serialization.
   */
  protected flushOperationQueue(): void {
    if (this.operationInProgress || this.operationQueue.length === 0) return;

    // Schedule next operation to run after current call stack clears
    setImmediate(() => {
      if (this.operationInProgress) return;
      const next = this.operationQueue.shift();
      if (next) next();
    });
  }

  /**
   * Notifies all waiters that an operation has completed.
   * Used by shutdown to know when all pending operations are done.
   */
  protected notifyCompletionWaiters(): void {
    if (!this.operationInProgress && this.operationQueue.length === 0) {
      const waiters = this.completionWaiters.splice(0);
      waiters.forEach((waiter) => waiter());
    }
  }

  /**
   * Waits for the current operation (if any) and all queued operations to complete.
   * Useful during shutdown to ensure no in-flight operations remain.
   */
  protected waitForOperationCompletion(cb: ICallback): void {
    if (!this.operationInProgress && this.operationQueue.length === 0) {
      return cb();
    }

    this.completionWaiters.push(cb);
  }

  /**
   * Merges configuration updates with the current configuration.
   *
   * @param current - Current configuration
   * @param updates - Configuration updates to merge
   * @returns Merged configuration
   */
  protected mergeConfig(
    current: IRedisSMQParsedConfig,
    updates: IRedisSMQConfig,
  ): IRedisSMQConfig {
    return {
      ...current,
      ...updates,
    };
  }

  /**
   * Returns the current parsed configuration.
   *
   * @returns The current configuration object
   */
  getConfig(): IRedisSMQParsedConfig {
    return this.config;
  }

  /**
   * Loads the configuration from Redis. If not found, returns ConfigurationNotFoundError.
   *
   * @param cb - Callback function called with the loaded configuration or error
   */
  load(cb: ICallback): void {
    this.runExclusive((done) => {
      withSharedPoolConnection((client, cb) => {
        const key = redisKeys.getMainKeys().keyConfiguration;
        client.get(key, (err, configData) => {
          if (err) return cb(err);
          if (!configData) return cb(new ConfigurationNotFoundError());

          this.config = JSON.parse(configData);
          return cb();
        });
      }, done);
    }, cb);
  }

  /**
   * Persists the current in-memory parsed configuration into Redis.
   *
   * @param cb - Callback function called when save completes
   */
  saveCurrentConfig(cb: ICallback): void {
    this.runExclusive((done) => {
      withSharedPoolConnection((client, cb) => {
        const key = redisKeys.getMainKeys().keyConfiguration;
        const configData = JSON.stringify(this.config);
        client.set(key, configData, {}, (err) => {
          if (err) return cb(err);
          cb();
        });
      }, done);
    }, cb);
  }

  /**
   * Updates the configuration with new values and persists to Redis.
   *
   * This method merges the provided configuration updates with the current
   * configuration, validates the result, and saves it to Redis.
   *
   * @param updates - Partial configuration object with updates
   * @param cb - Callback function called when update completes
   *
   * @example
   * ```typescript
   * const config = Configuration.getInstance();
   * config.updateConfig({
   *   logger: { enabled: false },
   *   redis: { options: { host: 'new-host' } }
   * }, (err) => {
   *   if (err) {
   *     console.error('Failed to update configuration:', err);
   *     return;
   *   }
   *   console.log('Configuration updated successfully');
   * });
   * ```
   */
  updateConfig(updates: IRedisSMQConfig, cb: ICallback): void {
    this.runExclusive((done) => {
      try {
        const updatedConfig = this.mergeConfig(this.config, updates);
        this.config = parseConfig(updatedConfig);
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new InvalidConfigurationError();
        return done(err);
      }

      withSharedPoolConnection((client, cb) => {
        const key = redisKeys.getMainKeys().keyConfiguration;
        const configData = JSON.stringify(this.config);

        client.set(key, configData, {}, (err) => {
          if (err) return cb(err);
          cb();
        });
      }, done);
    }, cb);
  }
}
