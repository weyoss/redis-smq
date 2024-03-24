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

export class Configuration {
  protected static instance: Configuration | null = null;
  protected config: IRedisSMQConfigRequired;

  protected constructor(config: IRedisSMQConfig) {
    this.config = this.parseConfiguration(config);
  }

  static getSetConfig(config: IRedisSMQConfig = {}): IRedisSMQConfigRequired {
    if (!Configuration.instance) {
      Configuration.instance = new Configuration(config);
    }
    return Configuration.instance.getConfig();
  }

  static reset(): void {
    Configuration.instance = null;
  }

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
