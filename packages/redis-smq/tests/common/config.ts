/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient, IRedisConfig } from 'redis-smq-common';
import { parseConfig } from '../../src/config-manager/parse-config.js';

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = Number(process.env.REDIS_PORT) || 6379;

export const redisConfig: IRedisConfig = {
  client: ERedisConfigClient.IOREDIS,
  options: {
    host: redisHost,
    port: redisPort,
    db: 1,
    showFriendlyErrorStack: true,
  },
};

export const config = parseConfig({
  namespace: 'testing',
  logger: {
    enabled: false,
    options: {
      logLevel: 'DEBUG',
    },
  },
  messageAudit: {
    acknowledgedMessages: true,
    deadLetteredMessages: true,
    unacknowledgementHistory: true,
  },
});
