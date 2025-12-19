/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ExchangeDirect, IExchangeParams, IQueueParams } from 'redis-smq';

const { promisifyAll } = bluebird;

export class ExchangeDirectService {
  protected exchangeDirect;

  constructor(exchangeDirect: ExchangeDirect) {
    this.exchangeDirect = promisifyAll(exchangeDirect);
  }

  async bindQueue(
    queue: IQueueParams,
    exchange: IExchangeParams,
    routingKey: string,
  ) {
    return this.exchangeDirect.bindQueueAsync(queue, exchange, routingKey);
  }

  async unbindQueue(
    queueParams: IQueueParams,
    exchange: IExchangeParams,
    routingKey: string,
  ) {
    await this.exchangeDirect.unbindQueueAsync(
      queueParams,
      exchange,
      routingKey,
    );
  }

  async matchQueues(exchange: IExchangeParams, routingKey: string) {
    return this.exchangeDirect.matchQueuesAsync(exchange, routingKey);
  }

  async deleteExchange(exchange: IExchangeParams) {
    return this.exchangeDirect.deleteAsync(exchange);
  }

  async getRoutingKeys(exchange: IExchangeParams) {
    return this.exchangeDirect.getRoutingKeysAsync(exchange);
  }

  async getRoutingKeyQueues(exchange: IExchangeParams, routingKey: string) {
    return this.exchangeDirect.getRoutingKeyQueuesAsync(exchange, routingKey);
  }
}
