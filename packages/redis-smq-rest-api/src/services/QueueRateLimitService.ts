/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IQueueParams,
  IQueueRateLimit,
  IQueueRateLimitManager,
} from 'redis-smq';
import { CallbackEmptyReplyError } from 'redis-smq-common';

export class QueueRateLimitService {
  constructor(protected queueRateLimit: IQueueRateLimitManager) {}

  async setRateLimit(
    queueParams: IQueueParams,
    queueRateLimit: IQueueRateLimit,
  ) {
    await this.queueRateLimit.set(queueParams, queueRateLimit);
    const rateLimit = await this.getRateLimit(queueParams);
    if (!rateLimit) {
      throw new CallbackEmptyReplyError();
    }
    return rateLimit;
  }

  async getRateLimit(queueParams: IQueueParams) {
    return this.queueRateLimit.get(queueParams);
  }

  async clearRateLimit(queueParams: IQueueParams) {
    return this.queueRateLimit.clear(queueParams);
  }
}
