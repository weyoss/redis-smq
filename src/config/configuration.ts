/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQConfig, IRedisSMQConfigRequired } from '../../types';
import Namespace from './namespace';
import Redis from './redis';
import Logger from './logger';
import Messages from './messages/messages';
import { EventListeners } from './event-listeners/event-listeners';

export class Configuration {
  protected static instance: Configuration | null = null;
  protected config: IRedisSMQConfigRequired;

  protected constructor(config: IRedisSMQConfig) {
    this.config = this.parseConfiguration(config);
  }

  protected parseConfiguration(
    config: IRedisSMQConfig,
  ): IRedisSMQConfigRequired {
    return {
      namespace: Namespace(config),
      redis: Redis(config),
      logger: Logger(config),
      messages: Messages(config),
      eventListeners: EventListeners(config),
    };
  }

  getConfig(): IRedisSMQConfigRequired {
    return this.config;
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
}
