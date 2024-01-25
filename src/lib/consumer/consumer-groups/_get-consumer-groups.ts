/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, RedisClient } from 'redis-smq-common';
import { IQueueParams } from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';

export function _getConsumerGroups(
  redisClient: RedisClient,
  queue: IQueueParams,
  cb: ICallback<string[]>,
): void {
  const { keyQueueConsumerGroups } = redisKeys.getQueueKeys(queue, null);
  redisClient.smembers(keyQueueConsumerGroups, cb);
}
