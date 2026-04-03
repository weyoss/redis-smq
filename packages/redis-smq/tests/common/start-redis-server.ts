/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisServer } from 'redis-smq-common';
import { redisConfig } from './config.js';

let redisServer: RedisServer | null = null;

export async function initializeRedis() {
  if (!redisServer) {
    redisServer = new RedisServer();
    const port = await redisServer.start();
    redisConfig.options = {
      ...redisConfig.options,
      port,
    };
  }
}

export async function shutDownRedisServer() {
  if (redisServer) await redisServer.shutdown();
}
