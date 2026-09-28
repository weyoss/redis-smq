/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class QueueNotBoundError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.Queue.NotBound';
  static override readonly defaultMessage =
    'Queue is not bound to the exchange.';
}
