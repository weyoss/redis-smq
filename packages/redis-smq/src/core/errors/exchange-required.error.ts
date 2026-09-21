/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';

/**
 * Indicates that an operation requiring an exchange was attempted before an
 * exchange was set on the message (e.g., setting a routing key).
 */
export class ExchangeRequiredError extends RedisSMQError {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Message.ExchangeRequired',
      defaultMessage: 'An exchange is required for this operation.',
    };
  }
}
