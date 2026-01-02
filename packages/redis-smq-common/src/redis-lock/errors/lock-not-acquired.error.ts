/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class LockNotAcquiredError extends RedisSMQError {
  getProps() {
    return {
      code: 'RedisSMQ.RedisLock.ExtendLock.Failed',
      defaultMessage:
        'Can not extend a lock which has not been yet acquired. Maybe a pending operation is in progress.',
    };
  }
}
