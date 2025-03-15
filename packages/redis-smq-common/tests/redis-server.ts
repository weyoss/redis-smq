/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisServer } from 'redis-smq-tools';
import { redisConfig } from './config.js';

const { shutdownRedisServer, startRedisServer } = redisServer;
let redisPort: number | null = null;

export async function initializeRedis() {
  if (!redisPort) {
    redisPort = await startRedisServer('../../data');
    redisConfig.options = {
      ...redisConfig,
      port: redisPort,
    };
  }
}

export async function shutDownRedisServer() {
  if (redisPort) await shutdownRedisServer(redisPort);
}
