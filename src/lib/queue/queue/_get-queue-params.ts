/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams } from '../../../../types';
import { redisKeys } from '../../../common/redis-keys/redis-keys';
import { Configuration } from '../../../config/configuration';

export function _getQueueParams(queue: string | IQueueParams): IQueueParams {
  const queueParams: { name: string; ns?: string } =
    typeof queue === 'string' ? { name: queue } : queue;
  const name = redisKeys.validateRedisKey(queueParams.name);
  const ns = queueParams.ns
    ? redisKeys.validateNamespace(queueParams.ns)
    : Configuration.getSetConfig().namespace;
  return {
    name,
    ns,
  };
}
