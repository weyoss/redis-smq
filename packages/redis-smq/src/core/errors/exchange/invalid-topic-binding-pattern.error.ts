/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class InvalidTopicBindingPatternError extends RedisSMQError<{
  pattern: string;
}> {
  static override readonly code =
    'RedisSMQ.Exchange.InvalidTopicBindingPattern';
  static override readonly defaultMessage = 'Invalid topic binding pattern.';
}
