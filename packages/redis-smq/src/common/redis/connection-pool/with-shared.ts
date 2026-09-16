/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback, IRedisClient } from 'redis-smq-common';
import { Pool } from './pool.js';
import { ERedisConnectionAcquisitionMode } from './types/connection-pool.js';

export function withShared<T>(
  operation: (client: IRedisClient, cb: ICallback<T>) => void,
  callback: ICallback<T>,
): void {
  const connectionPool = Pool.getInstance();
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
