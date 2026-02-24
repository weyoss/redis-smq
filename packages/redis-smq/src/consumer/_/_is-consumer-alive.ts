/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Heartbeat, ICallback, IRedisClient } from 'redis-smq-common';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';

export function _isConsumerAlive(
  redisClient: IRedisClient,
  consumerId: string,
  cb: ICallback<boolean>,
): void {
  const { keyConsumerHeartbeat } = redisKeys.getConsumerKeys(consumerId);
  Heartbeat.isComponentAlive(redisClient, keyConsumerHeartbeat, cb);
}
