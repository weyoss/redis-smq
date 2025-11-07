/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient } from 'redis-smq-common';
import { parseConfig } from '../../src/index.js';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const config = parseConfig({
  namespace: 'testing',
  redis: {
    client: ERedisConfigClient.IOREDIS,
    options: {
      host: redisHost,
      port: redisPort,
      db: 1,
      showFriendlyErrorStack: true,
    },
  },
  logger: {
    enabled: false,
    options: {
      logLevel: 'DEBUG',
    },
  },
  messageAudit: {
    acknowledgedMessages: true,
    deadLetteredMessages: true,
  },
  eventBus: {
    enabled: true,
  },
});
