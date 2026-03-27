/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';
import { IQueueParsedParams } from '../queue-manager/index.js';

export class InvalidMessageHandlerTypeError extends RedisSMQError<{
  queue: IQueueParsedParams;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.MessageHandler.InvalidType',
      defaultMessage: 'Invalid message handler type',
    };
  }
}
