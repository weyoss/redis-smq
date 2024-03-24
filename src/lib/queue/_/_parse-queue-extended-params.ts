/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { RedisKeysError } from '../../../common/redis-keys/redis-keys.error.js';
import { _parseQueueParams } from './_parse-queue-params.js';
import {
  IQueueParams,
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../types/index.js';

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
): IQueueParsedParams | RedisKeysError {
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
  let groupId: string | RedisKeysError | null = null;
  if (args.groupId) {
    groupId = redisKeys.validateRedisKey(args.groupId);
    if (groupId instanceof Error) return groupId;
  }
  return {
    queueParams,
    groupId,
  };
}
