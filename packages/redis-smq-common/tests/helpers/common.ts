/*
 * packages/redis-smq-common/tests/helpers/common.ts
 */

import bluebird from 'bluebird';
import { RedisClientFactory } from '../../src/redis-client/index.js';
import { redisConfig } from './config.js';

const redisClients: ReturnType<
  typeof bluebird.promisifyAll<RedisClientFactory>
>[] = [];

export async function startUp(): Promise<void> {
  const redisClient = await getRedisInstance();
  await redisClient.flushallAsync();
}

export async function shutdown(): Promise<void> {
  while (redisClients.length) {
    const redisClient = redisClients.pop();
    if (redisClient) {
      await redisClient.shutdownAsync();
    }
  }
}

export async function getRedisInstance(config = redisConfig) {
  const f = bluebird.promisifyAll(new RedisClientFactory(config));
  await f.initAsync();
  redisClients.push(f);
  return bluebird.promisifyAll(f.getInstance());
}
