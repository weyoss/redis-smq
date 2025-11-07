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
import { PanicError } from 'redis-smq-common';

const { promisifyAll } = bluebird;

export class QueueRateLimitService {
  protected queueRateLimit;

  constructor(queueRateLimit: QueueRateLimit) {
    this.queueRateLimit = promisifyAll(queueRateLimit);
  }

  async setRateLimit(
    queueParams: IQueueParams,
    queueRateLimit: IQueueRateLimit,
  ) {
    await this.queueRateLimit.setAsync(queueParams, queueRateLimit);
    const rateLimit = await this.getRateLimit(queueParams);
    if (!rateLimit) {
      throw new PanicError(`Expected a non-empty reply`);
    }
    return rateLimit;
  }

  async getRateLimit(queueParams: IQueueParams) {
    return this.queueRateLimit.getAsync(queueParams);
  }

  async clearRateLimit(queueParams: IQueueParams) {
    return this.queueRateLimit.clearAsync(queueParams);
  }
}
