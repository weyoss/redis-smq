/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQDefaultConfig } from './types/index.js';
import { EConsoleLoggerLevel, ERedisConfigClient } from 'redis-smq-common';

export const defaultConfig: IRedisSMQDefaultConfig = {
  namespace: 'default',
  messages: {
    store: {
      acknowledged: {
        store: false,
        queueSize: 0,
        expire: 0,
      },
      deadLettered: {
        store: false,
        queueSize: 0,
        expire: 0,
      },
    },
  },
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 6379,
      db: 0,
    },
  },
  eventBus: {
    enabled: false,
  },
  logger: {
    enabled: false,
    options: {
      includeTimestamp: true,
      colorize: true,
      logLevel: EConsoleLoggerLevel.INFO,
    },
  },
};
