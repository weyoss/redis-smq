/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient, RedisServer } from 'redis-smq-common';
import { config } from './config.js';

let redisServer: RedisServer | null = null;

export async function initializeRedis() {
  if (!redisServer) {
    redisServer = new RedisServer();
    const port = await redisServer.start();
    config.redis = config.redis ?? {
      client: ERedisConfigClient.IOREDIS,
    };
    config.redis.options = {
      ...config.redis.options,
      port,
    };
  }
}

export async function shutDownRedisServer() {
  if (redisServer) await redisServer.shutdown();
}
