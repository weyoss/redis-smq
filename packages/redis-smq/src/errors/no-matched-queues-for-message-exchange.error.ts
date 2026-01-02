/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';

export class NoMatchedQueuesForMessageExchangeError extends RedisSMQError {
  getProps() {
    return {
      code: 'RedisSMQ.Producer.NoMatchedQueuesForExchange',
      defaultMessage: 'No queues were matched for the message exchange.',
    };
  }
}
