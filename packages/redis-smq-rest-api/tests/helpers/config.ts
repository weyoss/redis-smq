/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient } from 'redis-smq-common';
import { IRedisSMQRestApiConfig } from '../../src/config/index.js';

export const config: IRedisSMQRestApiConfig = {
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: '127.0.0.1',
      port: 0,
      showFriendlyErrorStack: true,
    },
  },
};
