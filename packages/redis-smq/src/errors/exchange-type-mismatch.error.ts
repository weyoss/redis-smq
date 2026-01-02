/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';
import { EExchangeType } from '../exchange/index.js';

/**
 * Indicates that an operation was attempted on an exchange but the provided
 * exchange type does not match the existing exchange's type.
 */
export class ExchangeTypeMismatchError extends RedisSMQError<{
  expected: EExchangeType;
  actual: EExchangeType;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Exchange.TypeMismatch',
      defaultMessage: 'Exchange type mismatch.',
    };
  }
}
