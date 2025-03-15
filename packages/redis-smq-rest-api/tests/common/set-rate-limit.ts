/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { IQueueParams, IQueueRateLimit, QueueRateLimit } from 'redis-smq';

const { promisifyAll } = bluebird;

export async function setRateLimit(
  queue: IQueueParams,
  rateLimit: IQueueRateLimit,
) {
  const r = promisifyAll(new QueueRateLimit());
  await r.setAsync(queue, rateLimit);
  await r.shutdownAsync();
  return rateLimit;
}
