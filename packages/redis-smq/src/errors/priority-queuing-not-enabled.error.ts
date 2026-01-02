/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class PriorityQueuingNotEnabledError extends RedisSMQError {
  getProps() {
    return {
      code: 'RedisSMQ.Producer.PriorityQueuingNotEnabled',
      defaultMessage: 'Priority queuing is not enabled for this queue.',
    };
  }
}
