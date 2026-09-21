/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, IRedisClient } from 'redis-smq-common';
import { ERedisScriptName } from '../../common/scripts/registry.js';
import { keys } from '../../common/redis/keys/keys.js';
import { IQueueParams, IQueueRateLimit } from '../../../contracts/index.js';

export function _hasRateLimitExceeded(
  redisClient: IRedisClient,
  queue: IQueueParams,
  rateLimit: IQueueRateLimit,
  cb: ICallback<boolean>,
): void {
  const { limit, interval } = rateLimit;
  const { keyQueueRateLimit } = keys.getQueueKeys(queue.ns, queue.name, null);
  redisClient.runScript(
    ERedisScriptName.CHECK_QUEUE_RATE_LIMIT,
    [keyQueueRateLimit],
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
