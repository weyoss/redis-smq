/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

/**
 * Indicates that an operation requiring an exchange was attempted before an
 * exchange was set on the message (e.g., setting a routing key).
 */
export class ExchangeRequiredError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.Exchange.Required';
  static override readonly defaultMessage =
    'An exchange is required for this operation.';
}
