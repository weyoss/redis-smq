/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient } from 'redis-smq-common';
import { redisServer } from 'redis-smq-tools';
import { config } from './config.js';

const { shutdownRedisServer, startRedisServer } = redisServer;
let redisPort: number | null = null;

export async function initializeRedis() {
  if (!redisPort) {
    redisPort = await startRedisServer();
    config.redis = config.redis ?? {
      client: ERedisConfigClient.IOREDIS,
    };
    config.redis.options = {
      ...config.redis.options,
      port: redisPort,
    };
  }
}

export async function shutDownRedisServer() {
  if (redisPort) await shutdownRedisServer(redisPort);
}
