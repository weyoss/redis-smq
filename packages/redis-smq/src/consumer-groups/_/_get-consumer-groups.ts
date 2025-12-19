/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { IQueueParams } from '../../queue-manager/index.js';

export function _getConsumerGroups(
  redisClient: IRedisClient,
  queue: IQueueParams,
  cb: ICallback<string[]>,
): void {
  const { keyQueueConsumerGroups } = redisKeys.getQueueKeys(
    queue.ns,
    queue.name,
    null,
  );
  redisClient.smembers(keyQueueConsumerGroups, cb);
}
