/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';
import { IRedisSMQErrorProperties } from '../../errors/index.js';

export class WorkerIsShuttingDownError extends RedisSMQError {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Worker.ShuttingDown',
      defaultMessage: 'Worker is shutting down.',
    };
  }
}
