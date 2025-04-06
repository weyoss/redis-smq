/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisServer } from '../src/redis-server/index.js';
import { redisConfig } from './config.js';

let redisServer: RedisServer | null = null;

export async function initializeRedis() {
  if (!redisServer) {
    redisServer = new RedisServer();
    const redisPort = await redisServer.start();
    redisConfig.options = {
      ...redisConfig,
      port: redisPort,
    };
  }
}

export async function shutDownRedisServer() {
  if (redisServer) await redisServer.shutdown();
}
