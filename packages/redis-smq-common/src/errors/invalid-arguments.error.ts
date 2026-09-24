/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from './redis-smq.error.js';

export class InvalidArgumentsError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.Arguments.Invalid';
  static override readonly defaultMessage = 'Invalid arguments provided.';
}
