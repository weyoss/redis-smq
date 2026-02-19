/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IRedisSMQErrorProperties, RedisSMQError } from 'redis-smq-common';
import { EQueueOperationalState } from '../queue-manager/index.js';

export class QueueStateTransitionError extends RedisSMQError<{
  from: EQueueOperationalState;
  to: EQueueOperationalState;
}> {
  getProps(): IRedisSMQErrorProperties {
    return {
      code: 'RedisSMQ.Queue.StateTransitionFailed',
      defaultMessage: 'An invalid queue state transition is attempted.',
    };
  }
}
