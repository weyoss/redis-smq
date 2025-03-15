/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { createRedisClient, IRedisClient } from '../src/redis-client/index.js';
import { redisConfig } from './config.js';

const redisClients: IRedisClient[] = [];
const createClientInstanceAsync = bluebird.promisify(createRedisClient);

export async function startUp(): Promise<void> {
  const redisClient = await getRedisInstance();
  await redisClient.flushallAsync();
}

export async function shutdown(): Promise<void> {
  while (redisClients.length) {
    const redisClient = redisClients.pop();
    if (redisClient) {
      await bluebird.promisifyAll(redisClient).haltAsync();
    }
  }
}

export async function getRedisInstance(config = redisConfig) {
  const instance = await createClientInstanceAsync(config);
  const c = bluebird.promisifyAll(instance);
  redisClients.push(c);
  return c;
}
