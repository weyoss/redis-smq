/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import EventBus from './event-bus.js';
import Logger from './logger.js';
import Messages from './messages/messages.js';
import Namespace from './namespace.js';
import Redis from './redis.js';
import { IRedisSMQConfig, IRedisSMQConfigRequired } from './types/index.js';

/**
 * Configuration class for managing and setting up the RedisSMQ message queue.
 */
export class Configuration {
  protected static instance: Configuration | null = null;
  protected config: IRedisSMQConfigRequired;

  /**
   * Initializes the configuration properties using the provided `config` object.
   *
   * @param config - An object containing the configuration settings for the RedisSMQ library.
   * It should include properties for `namespace`, `redis`, `logger`, `messages`, and `eventBus`.
   *
   * @remarks
   * This constructor is protected and should not be called directly.
   * Instead, use the static method `getSetConfig` to obtain an instance of the Configuration class.
   *
   * @example
   * ```typescript
   * const config = {
   *   namespace: 'myNamespace',
   *   redis: {
   *     host: 'localhost',
   *     port: 6379,
   *   },
   * };
   *
   * const myConfig = Configuration.getSetConfig(config);
   * console.log(myConfig);
   * ```
   */
  protected constructor(config: IRedisSMQConfig) {
    this.config = this.parseConfiguration(config);
  }

  /**
   * A static method that returns the singleton instance of the Configuration class.
   * If an instance does not exist, it creates a new one using the provided configuration.
   *
   * @param config - An optional configuration object for the RedisSMQ.
   * If not provided, an empty object is used.
   *
   * @returns The singleton instance of the Configuration class,
   * containing the required configuration properties.
   *
   * @example
   * ```typescript
   * const config = {
   *   namespace: 'myNamespace',
   *   redis: {
   *     host: 'localhost',
   *     port: 6379,
   *   },
   * };
   *
   * const myConfig = Configuration.getSetConfig(config);
   * console.log(myConfig);
   * ```
   */
  static getSetConfig(config: IRedisSMQConfig = {}): IRedisSMQConfigRequired {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration(config);
    }
    return Configuration.instance.getConfig();
  }

  /**
   * Resets the singleton instance of the Configuration class.
   * This method is used to clear the current configuration and allow for a new instance to be created.
   *
   * @remarks
   * This method is useful when testing or when changing the configuration settings dynamically.
   * After calling this method, the next time `getSetConfig` is called, a new instance of the Configuration class will be created.
   *
   * @example
   * ```typescript
   * // Create a configuration instance
   * const config = {
   *   namespace: 'myNamespace',
   *   redis: {
   *     host: 'localhost',
   *     port: 6379,
   *   },
   * };
   *
   * const myConfig = Configuration.getSetConfig(config);
   *
   * // Reset the configuration
   * Configuration.reset();
   *
   * // Create a new configuration instance
   * const newConfig = Configuration.getSetConfig();
   * ```
   */
  static reset(): void {
    Configuration.instance = null;
  }

  /**
   * Retrieves the current configuration settings for the RedisSMQ library.
   *
   * @returns An object containing the required configuration properties including
   * `namespace`, `redis`, `logger`, `messages`, and `eventBus`.
   *
   * @example
   * ```typescript
   * const myConfig = Configuration.getSetConfig();
   * console.log(myConfig);
   * ```
   */
  getConfig(): IRedisSMQConfigRequired {
    return this.config;
  }

  protected parseConfiguration(
    config: IRedisSMQConfig,
  ): IRedisSMQConfigRequired {
    return {
      namespace: Namespace(config),
      redis: Redis(config),
      logger: Logger(config),
      messages: Messages(config),
      eventBus: EventBus(config),
    };
  }
}
