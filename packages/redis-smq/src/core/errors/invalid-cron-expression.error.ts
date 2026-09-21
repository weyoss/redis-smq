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
 * Indicates that a provided CRON expression is invalid and could not be parsed.
 */
export class InvalidCronExpressionError extends RedisSMQError<{
  expression: string;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Message.InvalidCronExpression',
      defaultMessage: 'Invalid CRON expression.',
    };
  }
}
