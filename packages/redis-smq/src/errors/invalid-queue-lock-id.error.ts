/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';
import { IQueueParams } from '../queue-manager/index.js';

export class InvalidQueueLockIdError extends RedisSMQError<{
  queue: IQueueParams;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Queue.InvalidQueueLockId',
      defaultMessage:
        "The provided lock ID doesn't match the queue's current lock",
    };
  }
}
