/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async } from '../async/index.js';
import { ICallback } from '../async/index.js';
import { RedisClientFactory } from './redis-client-factory.js';
import { IRedisClient } from './types/index.js';

/**
 * Executes a Redis operation with standardized error handling
 *
 * This helper method centralizes the common pattern of:
 * 1. Getting a Redis client instance
 * 2. Checking for client errors
 * 3. Checking for empty client replies
 * 4. Executing the Redis operation with proper error handling
 *
 * @param redisClient - Redis client to use for the operation
 * @param operation - Function that performs the actual Redis operation
 * @param callback - The original callback to invoke with results
 * @typeparam T - The type of data returned by the operation
 */
export function withRedisClient<T>(
  redisClient: RedisClientFactory,
  operation: (client: IRedisClient, cb: ICallback<T>) => void,
  callback: ICallback<T>,
): void {
  async.withCallback(
    (cb) => redisClient.getSetInstance(cb),
    operation,
    callback,
  );
}
