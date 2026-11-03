/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { RedisClientFactory } from '../../src/redis-client/index.js';
import { redisConfig } from './config.js';

type PromisifiedFactory = ReturnType<
  typeof bluebird.promisifyAll<RedisClientFactory>
>;

const activeFactories: PromisifiedFactory[] = [];

export async function getRedisInstance(config = redisConfig) {
  const factory = bluebird.promisifyAll(new RedisClientFactory(config));
  await factory.initAsync();
  activeFactories.push(factory);
  return bluebird.promisifyAll(factory.getInstance());
}

export async function startUp(): Promise<void> {
  const client = await getRedisInstance();
  await client.flushallAsync();
}

export async function shutdown(): Promise<void> {
  while (activeFactories.length > 0) {
    const factory = activeFactories.pop();
    if (factory) await factory.shutdownAsync();
  }
}
