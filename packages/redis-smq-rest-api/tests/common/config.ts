/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient } from 'redis-smq-common';
import { IRedisSMQHttpApiConfig } from '../../src/config/types/index.js';

export const config: IRedisSMQHttpApiConfig = {
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 0,
      showFriendlyErrorStack: true,
    },
  },
  logger: {
    enabled: false,
  },
  eventBus: {
    enabled: true,
  },
  messages: {
    store: true,
  },
};
