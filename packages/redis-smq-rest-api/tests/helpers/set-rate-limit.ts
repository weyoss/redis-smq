/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IQueueParams, IQueueRateLimit, RedisSMQ } from 'redis-smq';

export async function setRateLimit(
  queue: IQueueParams,
  rateLimit: IQueueRateLimit,
) {
  const r = RedisSMQ.createQueueRateLimitManager();
  await r.set(queue, rateLimit);
  return rateLimit;
}
