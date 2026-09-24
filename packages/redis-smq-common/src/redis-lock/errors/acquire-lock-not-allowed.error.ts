/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class AcquireLockNotAllowedError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.RedisLock.AcquireNotAllowed';
  static override readonly defaultMessage =
    'This method cannot be used when autoExtend is enabled.';
}
