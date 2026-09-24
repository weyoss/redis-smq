/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from './redis-smq.error.js';

export class PanicError extends RedisSMQError {
  static override readonly code = 'RedisSMQ.Panic';
  static override readonly defaultMessage =
    'Fatal error. The system may be in an inconsistent state.';
}
