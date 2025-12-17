/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { ELuaScriptName } from '../../common/redis/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { IQueueParams, IQueueRateLimit } from '../../queue-manager/index.js';

export function _hasRateLimitExceeded(
  redisClient: IRedisClient,
  queue: IQueueParams,
  rateLimit: IQueueRateLimit,
  cb: ICallback<boolean>,
): void {
  const { limit, interval } = rateLimit;
  const { keyQueueRateLimitCounter } = redisKeys.getQueueKeys(
    queue.ns,
    queue.name,
    null,
  );
  redisClient.runScript(
    ELuaScriptName.CHECK_QUEUE_RATE_LIMIT,
    [keyQueueRateLimitCounter],
    [limit, interval],
    (err, reply) => {
      if (err) cb(err);
      else {
        const hasExceeded = Boolean(reply);
        cb(null, hasExceeded);
      }
    },
  );
}
