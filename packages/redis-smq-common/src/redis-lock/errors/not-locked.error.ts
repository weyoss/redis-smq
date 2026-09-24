/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class NotLockedError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.RedisLock.NotLocked';
  static override readonly defaultMessage =
    'Cannot extend a lock which has not been acquired yet. A pending operation may be in progress.';
}
