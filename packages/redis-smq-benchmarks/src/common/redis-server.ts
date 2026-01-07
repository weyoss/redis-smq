/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient, RedisServer } from 'redis-smq-common';

export const redisConfig = {
  client: ERedisConfigClient.IOREDIS,
  options: {
    host: '127.0.0.1',
    port: 0,
    db: 0,
    showFriendlyErrorStack: true,
  },
};

const redisServer = new RedisServer();

export async function startRedisServer() {
  console.log('Starting Redis server...');
  const redisPort = await redisServer.start();
  redisConfig.options.port = redisPort;
  console.log('Redis Server started on port: ' + redisPort);
}

export async function shutdownRedisServer() {
  console.log('Shutting down Redis Server...');
  await redisServer.shutdown();
}
