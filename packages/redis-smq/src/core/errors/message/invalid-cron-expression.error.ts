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
 * Indicates that a provided CRON expression is invalid and could not be parsed.
 */
export class InvalidCronExpressionError extends RedisSMQError<{
  expression: string;
}> {
  static override readonly code = 'RedisSMQ.Message.InvalidCronExpression';
  static override readonly defaultMessage = 'Invalid CRON expression.';
}
