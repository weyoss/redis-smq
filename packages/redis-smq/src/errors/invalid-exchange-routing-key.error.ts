/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';
import { IExchangeParams } from '../exchange/index.js';

export class InvalidExchangeRoutingKeyError extends RedisSMQError<{
  exchange: IExchangeParams;
  routingKey: string;
}> {
  getProps() {
    return {
      code: 'RedisSMQ.Exchange.RoutingKeyRequired',
      defaultMessage: 'Please specify a routing key',
    };
  }
}
