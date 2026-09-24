/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';
import { TWorkerThreadChildMessage } from '../../worker/types/index.js';

export class WorkerThreadError extends RedisSMQError<TWorkerThreadChildMessage> {
  static override readonly code = 'RedisSMQ.Worker.ThreadError';
  static override readonly defaultMessage =
    'A worker thread has encountered an error.';
}
