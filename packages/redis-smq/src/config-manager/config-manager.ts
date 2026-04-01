/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig, IRedisSMQParsedConfig } from './types/index.js';
import { async, ICallback } from 'redis-smq-common';
import { parseConfig } from './parse-config.js';
import { InvalidConfigurationError } from '../errors/index.js';
import { Configuration } from './configuration.js';

/**
 * Manages RedisSMQ configuration operations including retrieval, updates, and reloads.
 * Provides a high-level interface for interacting with the configuration system,
 * handling validation, persistence, and cross-instance synchronization.
 *
 * This class works in conjunction with Configuration (low-level persistence) and
 * ConfigSync (cross-instance synchronization) to provide a complete configuration
 * management solution.
 *
 * @example
 * ```typescript
 * // Get current configuration
 * const config = ConfigManager.getConfig();
 *
 * // Update configuration
 * await configManager.updateConfig({ messageAudit: true });
 *
 * // Reload configuration from Redis
 * await configManager.reload();
 * ```
 */
export class ConfigManager {
  /**
   * Merges two configuration objects, with updates taking precedence over current.
   * This method performs a shallow merge of the configuration objects.
   *
   * @param current - The current parsed configuration
   * @param updates - The partial configuration updates to apply
   * @returns The merged configuration object
   * @internal
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
   * Reloads the configuration from Redis storage.
   * This method fetches the latest configuration from Redis and updates the
   * internal configuration state. Useful when manual refresh is needed or when
   * recovering from certain error conditions.
   *
   * @param cb - Optional callback function for error-first pattern
   * @returns Promise with the reloaded configuration if callback not provided
   *
   * @example
   * ```typescript
   * // Using async/await
   * const config = await configManager.reload();
   *
   * // Using callback
   * configManager.reload((err, config) => {
   *   if (err) {
   *     console.error('Failed to reload config:', err);
   *     return;
   *   }
   *   console.log('Config reloaded:', config);
   * });
   * ```
   */
  reload(): Promise<IRedisSMQParsedConfig>;
  reload(cb: ICallback<IRedisSMQParsedConfig>): void;
  reload(
    cb?: ICallback<IRedisSMQParsedConfig>,
  ): Promise<IRedisSMQParsedConfig> | void {
    return async.withOptionalCallback(cb, (callback) => {
      Configuration.getInstance().reload((err, reply) =>
        callback(err, reply?.data),
      );
    });
  }

  /**
   * Updates the configuration with the provided changes.
   * This method merges the updates with the current configuration, validates the
   * resulting configuration, and persists it to Redis. If the updated configuration
   * is identical to the current configuration, no operation is performed.
   *
   * The update operation is atomic and uses optimistic locking with version checking.
   * If a version mismatch occurs (another instance updated the config concurrently),
   * the operation will fail and the caller should retry after reloading.
   *
   * @param updates - Partial configuration object containing the changes to apply
   * @param cb - Optional callback function for error-first pattern
   * @returns Promise that resolves when update is complete if callback not provided
   * @throws {InvalidConfigurationError} If the updated configuration fails validation
   *
   * @example
   * ```typescript
   * // Update multiple settings
   * await configManager.updateConfig({
   *   redis: { host: 'redis.example.com', port: 6379 },
   *   logger: { level: 'debug' }
   * });
   *
   * // Using callback
   * configManager.updateConfig({ redis: { host: 'new-host' } }, (err) => {
   *   if (err) {
   *     console.error('Update failed:', err);
   *     return;
   *   }
   *   console.log('Configuration updated successfully');
   * });
   * ```
   */
  updateConfig(updates: IRedisSMQConfig): Promise<void>;
  updateConfig(updates: IRedisSMQConfig, cb: ICallback): void;
  updateConfig(updates: IRedisSMQConfig, cb?: ICallback): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      try {
        const configuration = Configuration.getInstance();
        const currentConfig = Configuration.getConfig();
        const updatedConfig = this.mergeConfig(currentConfig, updates);
        const parsedConfig = parseConfig(updatedConfig);

        if (JSON.stringify(currentConfig) === JSON.stringify(parsedConfig)) {
          return callback();
        }

        configuration.save(parsedConfig, callback);
      } catch (e: unknown) {
        const err = e instanceof Error ? e : new InvalidConfigurationError();
        return callback(err);
      }
    });
  }

  /**
   * Gets the current configuration version number.
   * The version number increments with each successful configuration update
   * and is used for optimistic locking to prevent concurrent modification conflicts.
   *
   * @returns The current configuration version number
   *
   * @example
   * ```typescript
   * const version = configManager.getConfigVersion();
   * console.log(`Configuration version: ${version}`);
   * ```
   */
  getConfigVersion(): number {
    return Configuration.getInstance().getConfig().version;
  }

  /**
   * Gets the current parsed configuration object.
   * This method returns a frozen copy of the configuration to prevent
   * accidental modifications. All configuration properties are fully parsed
   * and validated.
   *
   * @returns The current parsed configuration object (read-only)
   *
   * @example
   * ```typescript
   * const config = configManager.getConfig();
   *
   * // The returned object is frozen and cannot be modified
   * // config.namespace = 'new-ns'; // This will fail in strict mode
   * ```
   */
  getConfig(): IRedisSMQParsedConfig {
    return Configuration.getConfig();
  }
}
