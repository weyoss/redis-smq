/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { IQueueParams } from '../types/index.js';

/**
 * Retrieves all consumer IDs associated with a specific queue.
 *
 * @param client - The Redis client instance.
 * @param queue - The queue parameters.
 * @param cb - The callback function to handle the result.
 *
 * @returns void
 */
export function _getQueueConsumerIds(
  client: IRedisClient,
  queue: IQueueParams,
  cb: ICallback<string[]>,
): void {
  const { keyQueueConsumers } = redisKeys.getQueueKeys(
    queue.ns,
    queue.name,
    null,
  );
  client.hkeys(keyQueueConsumers, cb);
}
