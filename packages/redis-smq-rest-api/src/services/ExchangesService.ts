/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { Exchange, IQueueParams } from 'redis-smq';

const { promisifyAll } = bluebird;

export class ExchangesService {
  protected exchange;

  constructor(exchange: Exchange) {
    this.exchange = promisifyAll(exchange);
  }

  async getQueueExchanges(queue: IQueueParams) {
    return this.exchange.getQueueBoundExchangesAsync(queue);
  }

  async getAllExchanges() {
    return this.exchange.getAllExchangesAsync();
  }
}
