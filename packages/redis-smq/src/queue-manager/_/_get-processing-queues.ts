/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { IQueueParams } from '../types/index.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';

export function _getProcessingQueues(
  redisClient: IRedisClient,
  queue: IQueueParams,
  cb: ICallback<Record<string, string>>,
): void {
  const { keyQueueProcessingQueues } = redisKeys.getQueueKeys(
    queue.ns,
    queue.name,
    null,
  );
  redisClient.hgetall(keyQueueProcessingQueues, cb);
}
