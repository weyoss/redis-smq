/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from '../../errors/index.js';
import { IRedisSMQErrorProperties } from '../../errors/types/index.js';

export class WorkerPayloadRequiredError extends RedisSMQError {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Worker.PayloadRequired',
      defaultMessage: 'Worker payload is required.',
    };
  }
}
