/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisKeysError } from '../../../common/redis-keys/redis-keys.error.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import { IQueueParams } from '../types/index.js';

export function _parseQueueParams(
  queue: string | IQueueParams,
): IQueueParams | RedisKeysError {
  const queueParams: { name: string; ns?: string } =
    typeof queue === 'string' ? { name: queue } : queue;
  const name = redisKeys.validateRedisKey(queueParams.name);
  if (name instanceof RedisKeysError) return name;
  const ns = queueParams.ns
    ? redisKeys.validateNamespace(queueParams.ns)
    : Configuration.getSetConfig().namespace;
  if (ns instanceof RedisKeysError) return ns;
  return {
    name,
    ns,
  };
}
