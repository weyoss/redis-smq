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
  IMessagesConfig,
  IMessagesConfigStorageRequired,
} from '../../index.js';

export interface IEventBusConfig {
  enabled?: boolean;
}

export interface IRedisSMQConfig {
  namespace?: string;

  /**
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq-common/docs/api/interfaces/IRedisConfig.md
   */
  redis?: IRedisConfig;

  /**
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md
   */
  logger?: ILoggerConfig;

  /**
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/message-storage.md
   */
  messages?: IMessagesConfig;

  /**
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/event-bus.md
   */
  eventBus?: IEventBusConfig;
}

export interface IRedisSMQConfigRequired extends Required<IRedisSMQConfig> {
  messages: {
    store: IMessagesConfigStorageRequired;
  };
  eventBus: Required<IEventBusConfig>;
}
