/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { IQueueParams } from '../types/queue.js';

export function _queueExists(
  redisClient: IRedisClient,
  queue: IQueueParams,
  cb: ICallback<boolean>,
): void {
  const { keyQueues } = redisKeys.getMainKeys();
  redisClient.sismember(keyQueues, JSON.stringify(queue), (err, reply) => {
    if (err) cb(err);
    else cb(null, !!reply);
  });
}
