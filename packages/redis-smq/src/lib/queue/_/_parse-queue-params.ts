/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisKeysError } from '../../../common/redis-keys/errors/index.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import { QueueInvalidQueueParameterError } from '../errors/index.js';
import { IQueueParams } from '../types/index.js';

export function _parseQueueParams(
  queue: string | IQueueParams,
): IQueueParams | QueueInvalidQueueParameterError {
  const queueParams: { name: string; ns?: string } =
    typeof queue === 'string' ? { name: queue } : queue;
  const name = redisKeys.validateRedisKey(queueParams.name);
  if (name instanceof RedisKeysError)
    return new QueueInvalidQueueParameterError();
  const ns = queueParams.ns
    ? redisKeys.validateNamespace(queueParams.ns)
    : Configuration.getSetConfig().namespace;
  if (ns instanceof RedisKeysError)
    return new QueueInvalidQueueParameterError();
  return {
    name,
    ns,
  };
}
