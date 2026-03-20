/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import {
  Exchange,
  ExchangeDirect,
  ExchangeFanout,
  ExchangeTopic,
  IExchangeParams,
  IQueueParams,
  errors,
  EExchangeType,
} from 'redis-smq';

const { promisifyAll } = bluebird;

export class ExchangesService {
  protected exchange;
  protected exchangeDirect;
  protected exchangeFanout;
  protected exchangeTopic;

  constructor(
    exchange: Exchange,
    exchangeDirect: ExchangeDirect,
    exchangeFanout: ExchangeFanout,
    exchangeTopic: ExchangeTopic,
  ) {
    this.exchange = promisifyAll(exchange);
    this.exchangeDirect = promisifyAll(exchangeDirect);
    this.exchangeFanout = promisifyAll(exchangeFanout);
    this.exchangeTopic = promisifyAll(exchangeTopic);
  }

  async getExchange(exchangeParams: IExchangeParams) {
    const exchanges = await this.exchange.getAllExchangesAsync();
    const exchange = exchanges.find(
      (i) => i.ns === exchangeParams.ns && i.name === exchangeParams.name,
    );
    if (!exchange) {
      throw new errors.ExchangeNotFoundError();
    }
    return exchange;
  }

  async matchQueues(
    exchangeParams: IExchangeParams,
    params: { routingKey?: string },
  ) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type === EExchangeType.DIRECT) {
      return this.exchangeDirect.matchQueuesAsync(
        exchangeParams,
        params.routingKey ?? '', // will throw an error if empty or invalid
      );
    }
    if (exchange.type === EExchangeType.TOPIC) {
      return this.exchangeTopic.matchQueuesAsync(
        exchangeParams,
        params.routingKey ?? '', // will throw an error if empty or invalid
      );
    }
    return this.exchangeFanout.matchQueuesAsync(exchangeParams);
  }

  async bindQueue(
    queueParams: IQueueParams,
    exchangeParams: IExchangeParams,
    params: { routingKey?: string; routingPattern?: string },
  ) {
    if (params.routingKey) {
      return this.exchangeDirect.bindQueueAsync(
        queueParams,
        exchangeParams,
        params.routingKey ?? '', // will throw an error if empty or invalid
      );
    }
    if (params.routingPattern) {
      return this.exchangeTopic.bindQueueAsync(
        queueParams,
        exchangeParams,
        params.routingPattern ?? '', // will throw an error if empty or invalid
      );
    }
    return this.exchangeFanout.bindQueueAsync(queueParams, exchangeParams);
  }

  async unbindQueue(
    queueParams: IQueueParams,
    exchangeParams: IExchangeParams,
    params: { routingKey?: string; routingPattern?: string },
  ) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type === EExchangeType.DIRECT) {
      return this.exchangeDirect.unbindQueueAsync(
        queueParams,
        exchangeParams,
        params.routingKey ?? '', // will throw an error if empty or invalid
      );
    }
    if (exchange.type === EExchangeType.TOPIC) {
      return this.exchangeTopic.unbindQueueAsync(
        queueParams,
        exchangeParams,
        params.routingPattern ?? '', // will throw an error if empty or invalid
      );
    }
    return this.exchangeFanout.unbindQueueAsync(queueParams, exchangeParams);
  }

  async getRoutingKeys(exchangeParams: IExchangeParams) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type !== EExchangeType.DIRECT) {
      throw new errors.InvalidDirectExchangeParametersError({
        message: 'Provided exchange is not a DIRECT exchange',
      });
    }
    return this.exchangeDirect.getRoutingKeysAsync(exchangeParams);
  }

  async getRoutingPatterns(exchangeParams: IExchangeParams) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type !== EExchangeType.TOPIC) {
      throw new errors.InvalidTopicExchangeParamsError({
        message: 'Provided exchange is not a TOPIC exchange',
      });
    }
    return this.exchangeTopic.getRoutingPatternsAsync(exchangeParams);
  }

  async getBindings(
    exchangeParams: IExchangeParams,
    params: { routingKey?: string; routingPattern?: string },
  ) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type === EExchangeType.DIRECT) {
      if (!params.routingKey) {
        return this.exchangeDirect.getBindingsAsync(exchangeParams);
      }
      return this.exchangeDirect.getRoutingKeyBoundQueuesAsync(
        exchangeParams,
        params.routingKey ?? '', // will throw an error if empty or invalid
      );
    }
    if (exchange.type === EExchangeType.TOPIC) {
      if (!params.routingPattern) {
        return this.exchangeTopic.getBindingsAsync(exchangeParams);
      }
      return this.exchangeTopic.getRoutingPatternBoundQueuesAsync(
        exchangeParams,
        params.routingPattern ?? '', // will throw an error if empty or invalid
      );
    }
    return this.exchangeFanout.getBindingsAsync(exchangeParams);
  }

  async deleteExchange(exchangeParams: IExchangeParams) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type === EExchangeType.DIRECT) {
      return this.exchangeDirect.deleteAsync(exchangeParams);
    }
    if (exchange.type === EExchangeType.TOPIC) {
      return this.exchangeTopic.deleteAsync(exchangeParams);
    }
    return this.exchangeFanout.deleteAsync(exchangeParams);
  }

  async getQueueExchanges(queue: IQueueParams) {
    return this.exchange.getQueueExchangesAsync(queue);
  }

  async getNamespaceExchanges(ns: string) {
    return this.exchange.getNamespaceExchangesAsync(ns);
  }

  async getAllExchanges() {
    return this.exchange.getAllExchangesAsync();
  }
}
