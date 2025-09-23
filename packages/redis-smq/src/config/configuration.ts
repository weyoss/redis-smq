/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IRedisSMQConfig, IRedisSMQParsedConfig } from './types/index.js';
import { ConfigurationNotFoundError } from '../errors/configuration-not-found.error.js';
import { redisKeys } from '../common/redis-keys/redis-keys.js';
import { parseConfig } from './parse-config.js';
import { ConfigurationError } from '../errors/index.js';
import { defaultConfig } from './default-config.js';
import { withSharedPoolConnection } from '../common/redis-connection-pool/with-shared-pool-connection.js';

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
 * - Namespace-based configuration isolation
 * - Redis connection management
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

  /** The parsed and validated configuration object */
  protected config: IRedisSMQParsedConfig = defaultConfig;

  /**
   * Creates a new Configuration instance.
   *
   * This constructor is protected to enforce the singleton pattern.
   * Use the static `initialize` method to create and configure the instance.
   */
  protected constructor() {}

  /**
   * Gets the singleton instance of the Configuration class.
   *
   * @returns The Configuration instance
   * @throws {ConfigurationError} When the configuration has not been initialized
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
    if (!Configuration.instance) {
      throw new ConfigurationError('Configuration not initialized');
    }
    return Configuration.instance;
  }

  /**
   * Gets the current configuration object.
   *
   * This is a convenience method that combines `getInstance()` and `getConfig()`.
   *
   * @returns The current parsed configuration
   * @throws {ConfigurationError} When the configuration has not been initialized
   *
   * @example
   * ```typescript
   * const config = Configuration.getConfig();
   * console.log('Current namespace:', config.namespace);
   * console.log('Redis host:', config.redis.options.host);
   * ```
   */
  static getConfig(): IRedisSMQParsedConfig {
    return Configuration.getInstance().getConfig();
  }

  /**
   * Initializes the Configuration singleton with the specified namespace and Redis configuration.
   *
   * This method attempts to load existing configuration from Redis. If no configuration
   * is found, it creates and saves a default configuration. This ensures that the
   * configuration is always persisted and available for subsequent application starts.
   *
   * @param cb - Callback function called when initialization completes
   *
   * @throws {ConfigurationError} When the configuration is already initialized
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
  static initialize(cb: ICallback<Configuration>): void {
    if (Configuration.instance) {
      return cb(new ConfigurationError('Configuration already initialized'));
    }

    const instance = new Configuration();
    instance.load((err) => {
      if (err) {
        if (err instanceof ConfigurationNotFoundError) {
          // Configuration not found in Redis, save the default configuration
          return instance.saveCurrentConfig((err) => {
            if (err) return cb(err);
            //
            Configuration.instance = instance;
            cb(null);
          });
        }
        return cb(err);
      }

      // Configuration loaded successfully from Redis
      Configuration.instance = instance;
      cb(null, instance);
    });
  }

  static initializeWithConfig(config: IRedisSMQConfig, cb: ICallback): void {
    if (Configuration.instance) {
      return cb(new ConfigurationError('Configuration already initialized'));
    }

    const parsedConfig: IRedisSMQParsedConfig = parseConfig(config);
    const instance = new Configuration();
    return instance.saveConfig(parsedConfig, (err) => {
      if (err) return cb(err);
      //
      Configuration.instance = instance;
      cb(null);
    });
  }

  /**
   * Shuts down the Configuration singleton.
   *
   * This method performs a clean shutdown by resetting the singleton instance to null.
   *
   * After calling this method, you can call `initialize` again to create a new
   * configuration instance. This is particularly useful for testing scenarios,
   * application restarts, or when you need to reconfigure the application at runtime.
   *
   * @param cb - Callback function called when the shutdown operation completes.
   *
   * @example
   * ```typescript
   * // Basic shutdown with error handling
   * Configuration.shutdown((err) => {
   *   if (err) {
   *     console.error('Failed to shutdown configuration:', err);
   *     return;
   *   }
   *
   *   console.log('Configuration shutdown successfully');
   *
   *   // Now safe to reinitialize
   *   Configuration.initialize((err) => {
   *     if (!err) {
   *       console.log('Configuration reinitialized');
   *     }
   *   });
   * });
   *
   * // Shutdown in testing scenarios
   * afterEach((done) => {
   *   Configuration.shutdown(done);
   * });
   *
   * // Shutdown during application exit
   * process.on('SIGTERM', () => {
   *   Configuration.shutdown((err) => {
   *     if (err) console.error('Shutdown error:', err);
   *     process.exit(err ? 1 : 0);
   *   });
   * });
   * ```
   */
  static shutdown(cb: ICallback): void {
    Configuration.instance = null;
    cb();
  }

  /**
   * Loads configuration from Redis for the current namespace.
   *
   * This method retrieves the stored configuration from Redis and updates the current
   * instance with the loaded values. The configuration is automatically parsed and
   * validated during the loading process.
   *
   * @param cb - Callback function called with the loaded configuration or an error
   *
   * @throws {ConfigurationNotFoundError} When no configuration exists in Redis for the namespace
   * @throws {Error} When Redis client initialization fails or JSON parsing fails
   *
   * @example
   * ```typescript
   * const config = Configuration.getInstance();
   * config.load((err, loadedConfig) => {
   *   if (err) {
   *     if (err instanceof ConfigurationNotFoundError) {
   *       console.log('No configuration found in Redis');
   *     } else {
   *       console.error('Failed to load configuration:', err);
   *     }
   *     return;
   *   }
   *
   *   console.log('Configuration loaded:', loadedConfig.namespace);
   * });
   * ```
   */
  load(cb: ICallback<IRedisSMQParsedConfig>): void {
    withSharedPoolConnection((redisClient, cb) => {
      const { keyConfiguration } = redisKeys.getMainKeys();
      redisClient.get(keyConfiguration, (err, configData) => {
        if (err) return cb(err);
        if (!configData) {
          return cb(new ConfigurationNotFoundError(this.config.namespace));
        }

        try {
          this.config = JSON.parse(configData);
          cb(null, this.config);
        } catch (parseErr) {
          cb(
            new Error(
              `Failed to parse configuration from Redis: ${parseErr instanceof Error ? parseErr.message : 'Unknown error'}`,
            ),
          );
        }
      });
    }, cb);
  }

  /**
   * Saves the provided configuration to Redis.
   *
   * This method validates, parses, and stores the configuration in Redis.
   * The configuration is automatically serialized to JSON format for storage.
   * After successful save, the current instance configuration is updated.
   *
   * @param config - The configuration object to save. This will be validated and parsed
   *                before being stored in Redis.
   * @param cb - Callback function called when the save operation completes
   *
   * @throws {Error} When Redis client initialization fails or Redis operations fail
   *
   * @example
   * ```typescript
   * const config = Configuration.getInstance();
   * const newConfig = {
   *   namespace: 'my-app',
   *   logger: { enabled: true, options: { level: 'info' } },
   *   eventBus: { enabled: false }
   * };
   *
   * config.save(newConfig, (err) => {
   *   if (err) {
   *     console.error('Failed to save configuration:', err);
   *     return;
   *   }
   *
   *   console.log('Configuration saved successfully');
   * });
   * ```
   */
  save(config: IRedisSMQConfig, cb: ICallback): void {
    const parsedConfig = parseConfig(config);
    this.saveConfig(parsedConfig, cb);
  }

  /**
   * Saves the current instance configuration to Redis.
   *
   * This is a convenience method that saves the current configuration without
   * needing to pass it as a parameter. It's particularly useful when you've
   * made changes to the configuration and want to persist them.
   *
   * @param cb - Callback function called when the save operation completes
   *
   * @throws {Error} When Redis client initialization fails or Redis operations fail
   *
   * @example
   * ```typescript
   * const config = Configuration.getInstance();
   *
   * // Modify configuration in memory
   * config.getConfig().logger.enabled = false;
   *
   * // Save the current state to Redis
   * config.saveCurrentConfig((err) => {
   *   if (err) {
   *     console.error('Failed to save current configuration:', err);
   *     return;
   *   }
   *
   *   console.log('Current configuration saved to Redis');
   * });
   * ```
   */
  saveCurrentConfig(cb: ICallback): void {
    this.saveConfig(this.config, cb);
  }

  reset(cb: ICallback): void {
    const defaultConfig = parseConfig({});
    this.saveConfig(defaultConfig, cb);
  }

  /**
   * Gets the current configuration object.
   *
   * This method returns the current parsed and validated configuration.
   * The returned object is a read-only representation of the configuration
   * and should not be modified directly. Use `updateConfig()` to make changes.
   *
   * @returns The current parsed configuration containing all RedisSMQ settings
   *
   * @example
   * ```typescript
   * const config = Configuration.getInstance();
   * const currentConfig = config.getConfig();
   *
   * console.log('NamespaceManager:', currentConfig.namespace);
   * console.log('Logger enabled:', currentConfig.logger.enabled);
   * console.log('Redis host:', currentConfig.redis.options.host);
   * console.log('Event bus enabled:', currentConfig.eventBus.enabled);
   * ```
   */
  getConfig(): IRedisSMQParsedConfig {
    return this.config;
  }

  /**
   * Updates the current configuration with new values and saves to Redis.
   *
   * This method merges the provided configuration updates with the current
   * configuration and saves the result to Redis. Only the provided fields
   * will be updated; other fields will retain their current values.
   *
   * The configuration is validated and parsed before being saved, ensuring
   * that the updated configuration is valid and consistent.
   *
   * @param updates - Configuration updates to apply. Can be a partial configuration
   *                 object containing only the fields you want to change.
   * @param cb - Callback function called when the update operation completes
   *
   * @throws {Error} When configuration validation fails or Redis operations fail
   *
   * @example
   * ```typescript
   * const config = Configuration.getInstance();
   *
   * // Update only logger settings
   * config.updateConfig({
   *   logger: {
   *     enabled: false,
   *     options: { level: 'error' }
   *   }
   * }, (err) => {
   *   if (err) {
   *     console.error('Failed to update configuration:', err);
   *     return;
   *   }
   *
   *   console.log('Logger configuration updated');
   * });
   *
   * // Update multiple settings
   * config.updateConfig({
   *   logger: { enabled: true },
   *   eventBus: { enabled: true }
   * }, (err) => {
   *   if (!err) console.log('Multiple settings updated');
   * });
   * ```
   */
  updateConfig(updates: IRedisSMQConfig, cb: ICallback<void>): void {
    try {
      const mergedConfig: IRedisSMQConfig = {
        namespace: updates.namespace || this.config.namespace,
        redis: updates.redis || this.config.redis,
        logger: updates.logger || this.config.logger,
        messages: updates.messages || this.config.messages,
        eventBus: updates.eventBus || this.config.eventBus,
      };

      this.save(mergedConfig, cb);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      cb(error);
    }
  }

  /**
   * Checks if configuration exists in Redis for the current namespace.
   *
   * This method queries Redis to determine whether a configuration has been
   * previously saved for the current namespace. It's useful for determining
   * whether to load existing configuration or create a new one.
   *
   * @param cb - Callback function called with the existence check result
   *
   * @throws {Error} When Redis client initialization fails or Redis operations fail
   *
   * @example
   * ```typescript
   * const config = Configuration.getInstance();
   *
   * config.exists((err, exists) => {
   *   if (err) {
   *     console.error('Failed to check configuration existence:', err);
   *     return;
   *   }
   *
   *   if (exists) {
   *     console.log('Configuration exists in Redis');
   *     config.load((loadErr, loadedConfig) => {
   *       if (!loadErr) console.log('Configuration loaded');
   *     });
   *   } else {
   *     console.log('No configuration found, using defaults');
   *     config.saveCurrentConfig((saveErr) => {
   *       if (!saveErr) console.log('Default configuration saved');
   *     });
   *   }
   * });
   * ```
   */
  exists(cb: ICallback<boolean>): void {
    withSharedPoolConnection((redisClient, cb) => {
      const { keyConfiguration } = redisKeys.getMainKeys();
      redisClient.get(keyConfiguration, (err, configData) => {
        if (err) return cb(err);
        cb(null, configData !== null);
      });
    }, cb);
  }

  protected saveConfig(
    config: IRedisSMQParsedConfig,
    cb: ICallback<void>,
  ): void {
    withSharedPoolConnection((redisClient, cb) => {
      const { keyConfiguration } = redisKeys.getMainKeys();
      const configStr = JSON.stringify(config);
      redisClient.set(keyConfiguration, configStr, {}, (setErr) => {
        if (setErr) return cb(setErr);
        this.config = config;
        cb(null);
      });
    }, cb);
  }
}
