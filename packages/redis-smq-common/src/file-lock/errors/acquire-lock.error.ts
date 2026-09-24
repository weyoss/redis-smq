/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class AcquireLockError extends RedisSMQError<{
  lockFile: string;
  error: string;
}> {
  static override readonly code = 'RedisSMQ.FileLock.AcquireFailed';
  static override readonly defaultMessage =
    'Failed to acquire a file lock after multiple attempts.';
}
