/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class QueueNotEmptyError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.Queue.NotEmpty';
  static override readonly defaultMessage = 'Queue is not empty.';
}
