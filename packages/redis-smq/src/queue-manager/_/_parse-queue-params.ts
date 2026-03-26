/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Configuration } from '../../config/index.js';
import { InvalidQueueParametersError } from '../../errors/index.js';
import { IQueueParams } from '../types/index.js';
import { validateRedisKey } from '../../common/redis/redis-keys/validator.js';

export function _parseQueueParams(
  queue: string | IQueueParams,
): IQueueParams | InvalidQueueParametersError {
  const queueParams: { name: string; ns?: string } =
    typeof queue === 'string' ? { name: queue } : queue;
  const name = validateRedisKey(queueParams.name);
  if (name instanceof Error) return new InvalidQueueParametersError();
  const ns = queueParams.ns
    ? validateRedisKey(queueParams.ns)
    : Configuration.getConfig().namespace;
  if (ns instanceof Error) return new InvalidQueueParametersError();
  return {
    name,
    ns,
  };
}
