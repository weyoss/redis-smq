/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';
import { EQueueOperation } from '../queue-operation-validator/index.js';
import { IQueueParams } from '../queue-manager/index.js';

export class QueueOperationForbiddenError extends RedisSMQError<{
  operation: EQueueOperation;
  queue: IQueueParams;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Queue.OperationForbidden',
      defaultMessage:
        'The current queue state does not allow the requested operation. Try again later.',
    };
  }
}
