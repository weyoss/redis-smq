/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class QueueHasNoConsumerGroupsError extends RedisSMQError {
  getProps() {
    return {
      code: 'RedisSMQ.Queue.NoConsumerGroups',
      defaultMessage: 'Queue has no consumer groups.',
    };
  }
}
