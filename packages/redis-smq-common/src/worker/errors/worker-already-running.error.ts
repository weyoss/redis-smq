/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties } from '../../errors/types/index.js';
import { RedisSMQError } from '../../errors/index.js';

export class WorkerAlreadyRunningError extends RedisSMQError {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Worker.AlreadyRunning',
      defaultMessage: 'Worker is already running.',
    };
  }
}
