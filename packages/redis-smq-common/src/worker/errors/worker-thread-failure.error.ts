/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';

export class WorkerThreadFailureError extends RedisSMQError<{ code: number }> {
  static override readonly code = 'RedisSMQ.Worker.Failure';
  static override readonly defaultMessage =
    'A worker thread has encountered an error.';
}
