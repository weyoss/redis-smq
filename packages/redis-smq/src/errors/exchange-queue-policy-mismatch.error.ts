/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';
import { EExchangeQueuePolicy, EExchangeType } from '../exchange/index.js';

/**
 * Indicates that a queue could not be bound to an exchange because the queue's
 * type is incompatible with the exchange's queue policy.
 */
export class ExchangeQueuePolicyMismatchError extends RedisSMQError<{
  exchangeType: EExchangeType;
  queuePolicy: EExchangeQueuePolicy;
  expected: string;
  actual: string;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Exchange.QueuePolicyMismatch',
      defaultMessage: `The queue's type is not compatible with the exchange's queue policy.`,
    };
  }
}
