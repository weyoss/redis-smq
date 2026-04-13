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
 * Manages RedisSMQ configuration operations.
 *
 * Provides methods to get, update, and reload configuration,
 * with validation and cross-instance synchronization.
 *
 * @example
 * const config = ConfigManager.getConfig();
 *
 * await configManager.updateConfig({ messageAudit: true });
 *
 * const newConfig = await configManager.reload();
 */
export class ConfigManager {
  /**
   * Merges two configuration objects.
   *
   * @param current - Current parsed configuration
   * @param updates - Partial configuration updates to apply
   * @returns Merged configuration object
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
   * Reloads configuration from Redis storage.
   *
   * @param cb - (err, config) => void. Returns IRedisSMQParsedConfig
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const config = await configManager.reload();
   *
   * // Callback
   * configManager.reload((err, config) => {
   *   if (err) throw err;
   *   console.log(config);
   * });
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
   * Updates configuration with provided changes.
   *
   * @param updates - Partial configuration to apply
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await configManager.updateConfig({ messageAudit: true });
   *
   * // Callback
   * configManager.updateConfig({ messageAudit: true }, (err) => {
   *   if (err) throw err;
   * });
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
   *
   * @returns Version number (increments on each update)
   *
   * @example
   * const version = configManager.getConfigVersion();
   * console.log(version);
   */
  getConfigVersion(): number {
    return Configuration.getInstance().getConfig().version;
  }

  /**
   * Gets the current parsed configuration object.
   *
   * @returns Read-only parsed configuration
   *
   * @example
   * const config = configManager.getConfig();
   * console.log(config.namespace);
   */
  getConfig(): IRedisSMQParsedConfig {
    return Configuration.getConfig();
  }
}
