/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { ERedisScriptName } from '../../common/redis/scripts.js';
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
    ERedisScriptName.CHECK_QUEUE_RATE_LIMIT,
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
