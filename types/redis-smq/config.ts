/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ILoggerConfig, IRedisConfig } from 'redis-smq-common';
import { IMessagesConfig, IMessagesConfigStorageRequired } from '../message';
import {
  IEventListenersConfig,
  IEventListenersConfigRequired,
} from '../event-listener';

export interface IRedisSMQConfig {
  redis?: IRedisConfig;
  namespace?: string;
  logger?: ILoggerConfig;
  messages?: IMessagesConfig;
  eventListeners?: IEventListenersConfig;
}

export interface IRedisSMQConfigRequired extends Required<IRedisSMQConfig> {
  messages: {
    store: IMessagesConfigStorageRequired;
  };
  eventListeners: IEventListenersConfigRequired;
}
