/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { IQueueParams } from '../../queue-manager/index.js';

/**
 * Retrieves all queues associated with a specific consumer.
 *
 * @param redisClient - The Redis client instance.
 * @param consumerId - The consumer ID.
 * @param cb - The callback function to handle the result.
 *
 * @returns void
 */
export function _getConsumerQueues(
  redisClient: IRedisClient,
  consumerId: string,
  cb: ICallback<IQueueParams[]>,
): void {
  const { keyConsumerQueues } = redisKeys.getConsumerKeys(consumerId);
  redisClient.smembers(keyConsumerQueues, (err, reply) => {
    if (err) return cb(err);
    const queues: IQueueParams[] = (reply ?? []).map((i) => JSON.parse(i));
    cb(null, queues);
  });
}
