/*
 * packages/redis-smq-rest-api-refactor/tests/helpers/redis-client.ts
 */

import {
  ERedisConfigClient,
  IRedisClient,
  RedisClientFactory,
} from 'redis-smq-common';
import bluebird from 'bluebird';

export type TRedisClientAsync = ReturnType<
  typeof bluebird.promisifyAll<IRedisClient>
>;

/**
 * Opens a Redis client against the given port.
 */
export async function createRedisClient(
  port: number,
): Promise<TRedisClientAsync> {
  const factory = bluebird.promisifyAll(
    new RedisClientFactory({
      client: ERedisConfigClient.IOREDIS,
      options: { host: '127.0.0.1', port },
    }),
  );
  await factory.initAsync();
  return bluebird.promisifyAll(factory.getInstance());
}
