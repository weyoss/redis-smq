/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILoggerConfig, IRedisConfig } from 'redis-smq-common';
import {
  IEventBusConfig,
  IMessagesConfig,
  IMessagesConfigStorageRequired,
} from '../../lib/index.js';

export interface IRedisSMQConfig {
  redis?: IRedisConfig;
  namespace?: string;
  logger?: ILoggerConfig;
  messages?: IMessagesConfig;
  eventBus?: IEventBusConfig;
}

export interface IRedisSMQConfigRequired extends Required<IRedisSMQConfig> {
  messages: {
    store: IMessagesConfigStorageRequired;
  };
  eventBus: Required<IEventBusConfig>;
}
