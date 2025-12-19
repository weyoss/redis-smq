/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ExchangeTopic, IExchangeParams, IQueueParams } from 'redis-smq';

const { promisifyAll } = bluebird;

export class ExchangeTopicService {
  protected exchangeTopic;

  constructor(exchangeTopic: ExchangeTopic) {
    this.exchangeTopic = promisifyAll(exchangeTopic);
  }

  async bindQueue(
    queue: IQueueParams,
    exchange: IExchangeParams,
    bindingPattern: string,
  ) {
    return this.exchangeTopic.bindQueueAsync(queue, exchange, bindingPattern);
  }

  async unbindQueue(
    queueParams: IQueueParams,
    exchange: IExchangeParams,
    bindingPattern: string,
  ) {
    await this.exchangeTopic.unbindQueueAsync(
      queueParams,
      exchange,
      bindingPattern,
    );
  }

  async matchQueues(exchange: IExchangeParams, bindingPattern: string) {
    return this.exchangeTopic.matchQueuesAsync(exchange, bindingPattern);
  }

  async deleteExchange(exchange: IExchangeParams) {
    return this.exchangeTopic.deleteAsync(exchange);
  }

  async getBindingPatterns(exchange: IExchangeParams) {
    return this.exchangeTopic.getBindingPatternsAsync(exchange);
  }

  async getBindingPatternQueues(
    exchange: IExchangeParams,
    bindingPattern: string,
  ) {
    return this.exchangeTopic.getBindingPatternQueuesAsync(
      exchange,
      bindingPattern,
    );
  }
}
