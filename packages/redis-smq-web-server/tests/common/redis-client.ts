/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { RedisClientFactory } from 'redis-smq-common';
import { config } from './config.js';

const { promisifyAll } = bluebird;

let redisClient: ReturnType<
  typeof bluebird.promisifyAll<RedisClientFactory>
> | null = null;

export async function getRedisClientInstance() {
  if (!redisClient) {
    if (!config.redis) throw new Error(`Redis configuration is required`);
    redisClient = promisifyAll(new RedisClientFactory(config.redis));
    await redisClient.initAsync();
  }
  return promisifyAll(redisClient.getInstance());
}

export async function shutdownRedisClient() {
  if (redisClient) {
    await redisClient.shutdownAsync();
  }
}
