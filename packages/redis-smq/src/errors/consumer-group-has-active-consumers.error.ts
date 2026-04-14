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

export class ConsumerGroupHasActiveConsumersError extends RedisSMQError<{
  queue: IQueueParams;
  consumerGroupId: string;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ..ConsumerGroup.ConsumerGroupHasActiveConsumers',
      defaultMessage:
        'The consumer group has active consumers and cannot be deleted. Before deleting a consumer group, make sure all its consumers are offline.',
    };
  }
}
