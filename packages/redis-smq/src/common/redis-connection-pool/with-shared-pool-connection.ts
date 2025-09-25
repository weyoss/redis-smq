/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { RedisConnectionPool } from './redis-connection-pool.js';
import { ERedisConnectionAcquisitionMode } from './types/connection-pool.js';

export function withSharedPoolConnection<T>(
  operation: (client: IRedisClient, cb: ICallback<T>) => void,
  callback: ICallback<T>,
): void {
  const connectionPool = RedisConnectionPool.getInstance();
  async.withCallback(
    (cb) => connectionPool.acquire(ERedisConnectionAcquisitionMode.SHARED, cb),
    (redisClient: IRedisClient, cb: ICallback<T>) => {
      operation(redisClient, (err, result) => {
        connectionPool.release(redisClient);
        cb(err, result);
      });
    },
    callback,
  );
}
