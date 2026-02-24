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

export function _isConsumerListAlive(
  redisClient: IRedisClient,
  consumerIds: string[],
  cb: ICallback<Record<string, boolean>>,
): void {
  if (!consumerIds.length) {
    cb(null, {});
    return;
  }
  const heartbeatKeys = consumerIds.map((id) => {
    const { keyConsumerHeartbeat } = redisKeys.getConsumerKeys(id);
    return keyConsumerHeartbeat;
  });
  Heartbeat.areComponentsAlive(redisClient, heartbeatKeys, cb);
}
