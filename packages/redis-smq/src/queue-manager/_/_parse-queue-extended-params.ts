/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { InvalidQueueParametersError } from '../../errors/index.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import {
  IQueueParams,
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../types/index.js';
import { _parseQueueParams } from './_parse-queue-params.js';
import { RedisSMQError } from 'redis-smq-common';

function isQueueParams(args: unknown): args is IQueueParams {
  return (
    !!args &&
    typeof args === 'object' &&
    Object.keys(args).includes('ns') &&
    Object.keys(args).includes('name')
  );
}

export function _parseQueueExtendedParams(
  args: TQueueExtendedParams,
): IQueueParsedParams | InvalidQueueParametersError {
  if (typeof args === 'string') {
    const queueParams = _parseQueueParams(args);
    if (queueParams instanceof Error) return queueParams;
    return {
      queueParams,
      groupId: null,
    };
  }
  if (isQueueParams(args)) {
    const queueParams = _parseQueueParams(args);
    if (queueParams instanceof Error) return queueParams;
    return {
      queueParams,
      groupId: null,
    };
  }
  const queueParams = _parseQueueParams(args.queue);
  if (queueParams instanceof Error) return queueParams;
  let groupId: string | RedisSMQError | null = null;
  if (args.groupId) {
    groupId = redisKeys.validateRedisKey(args.groupId);
    if (groupId instanceof Error) return new InvalidQueueParametersError();
  }
  return {
    queueParams,
    groupId,
  };
}
