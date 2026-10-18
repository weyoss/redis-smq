/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import {
  ERedisConfigClient,
  type IRedisClient,
  RedisClientFactory,
} from 'redis-smq-common';

export type TRedisClientAsync = ReturnType<
  typeof bluebird.promisifyAll<IRedisClient>
>;

/**
 * Opens a promisified Redis client against the given port.
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
