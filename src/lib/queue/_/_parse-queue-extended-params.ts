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
import { QueueInvalidQueueParameterError } from '../errors/index.js';
import {
  IQueueParams,
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../types/index.js';
import { _parseQueueParams } from './_parse-queue-params.js';

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
): IQueueParsedParams | QueueInvalidQueueParameterError {
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
    if (groupId instanceof Error) return new QueueInvalidQueueParameterError();
  }
  return {
    queueParams,
    groupId,
  };
}
