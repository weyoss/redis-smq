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
  /**
   * @see https://github.com/weyoss/redis-smq-common/blob/master/packages/redis-smq/docs/api/README.md#iredisconfig
   */
  redis?: IRedisConfig;
  namespace?: string;

  /**
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq-common/docs/api/interfaces/ILoggerConfig.md
   */
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
