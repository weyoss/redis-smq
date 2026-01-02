/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';

export class QueueManagerActiveConsumersError extends RedisSMQError {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Queue.ActiveConsumers',
      defaultMessage:
        'The queue has active consumers and cannot be deleted. Before deleting a queue, make sure all its consumers are offline.',
    };
  }
}
