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
  getProps() {
    return {
      code: 'RedisSMQ.RedisLock.AcquireLock.NotAllowed',
      defaultMessage: 'This method can not be used when autoExtend is enabled.',
    };
  }
}
