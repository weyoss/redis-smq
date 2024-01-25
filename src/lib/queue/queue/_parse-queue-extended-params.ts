/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IQueueParams,
  IQueueParsedParams,
  TQueueExtendedParams,
} from '../../../../types';
import { _parseQueueParams } from './_parse-queue-params';
import { redisKeys } from '../../../common/redis-keys/redis-keys';

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
): IQueueParsedParams {
  if (typeof args === 'string') {
    return {
      queueParams: _parseQueueParams(args),
      groupId: null,
    };
  }
  if (isQueueParams(args)) {
    return {
      queueParams: _parseQueueParams(args),
      groupId: null,
    };
  }
  return {
    queueParams: _parseQueueParams(args.queue),
    groupId: args.groupId ? redisKeys.validateRedisKey(args.groupId) : null,
  };
}
