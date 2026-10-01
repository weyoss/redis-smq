/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  IExchangeParams,
  IQueueParams,
  errors,
  EExchangeType,
  IExchangeDirect,
  IExchangeFanout,
  IExchangeTopic,
  IExchangeManager,
} from 'redis-smq';

export class ExchangesService {
  protected exchange;
  protected exchangeDirect;
  protected exchangeFanout;
  protected exchangeTopic;

  constructor(
    exchangeManager: IExchangeManager,
    exchangeDirect: IExchangeDirect,
    exchangeFanout: IExchangeFanout,
    exchangeTopic: IExchangeTopic,
  ) {
    this.exchange = exchangeManager;
    this.exchangeDirect = exchangeDirect;
    this.exchangeFanout = exchangeFanout;
    this.exchangeTopic = exchangeTopic;
  }

  async getExchange(exchangeParams: IExchangeParams) {
    const exchanges = await this.exchange.getAllExchanges();
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
      return this.exchangeDirect.matchQueues(
        exchangeParams,
        params.routingKey ?? '', // will throw an error if empty or invalid
      );
    }
    if (exchange.type === EExchangeType.TOPIC) {
      return this.exchangeTopic.matchQueues(
        exchangeParams,
        params.routingKey ?? '', // will throw an error if empty or invalid
      );
    }
    return this.exchangeFanout.matchQueues(exchangeParams);
  }

  async bindQueue(
    queueParams: IQueueParams,
    exchangeParams: IExchangeParams,
    params: { routingKey?: string; routingPattern?: string },
  ) {
    if (params.routingKey) {
      return this.exchangeDirect.bindQueue(
        queueParams,
        exchangeParams,
        params.routingKey ?? '', // will throw an error if empty or invalid
      );
    }
    if (params.routingPattern) {
      return this.exchangeTopic.bindQueue(
        queueParams,
        exchangeParams,
        params.routingPattern ?? '', // will throw an error if empty or invalid
      );
    }
    return this.exchangeFanout.bindQueue(queueParams, exchangeParams);
  }

  async unbindQueue(
    queueParams: IQueueParams,
    exchangeParams: IExchangeParams,
    params: { routingKey?: string; routingPattern?: string },
  ) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type === EExchangeType.DIRECT) {
      return this.exchangeDirect.unbindQueue(
        queueParams,
        exchangeParams,
        params.routingKey ?? '', // will throw an error if empty or invalid
      );
    }
    if (exchange.type === EExchangeType.TOPIC) {
      return this.exchangeTopic.unbindQueue(
        queueParams,
        exchangeParams,
        params.routingPattern ?? '', // will throw an error if empty or invalid
      );
    }
    return this.exchangeFanout.unbindQueue(queueParams, exchangeParams);
  }

  async getRoutingKeys(exchangeParams: IExchangeParams) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type !== EExchangeType.DIRECT) {
      throw new errors.InvalidDirectExchangeParametersError({
        message: 'Provided exchange is not a DIRECT exchange',
      });
    }
    return this.exchangeDirect.getRoutingKeys(exchangeParams);
  }

  async getRoutingPatterns(exchangeParams: IExchangeParams) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type !== EExchangeType.TOPIC) {
      throw new errors.InvalidTopicExchangeParamsError({
        message: 'Provided exchange is not a TOPIC exchange',
      });
    }
    return this.exchangeTopic.getRoutingPatterns(exchangeParams);
  }

  async getBindings(
    exchangeParams: IExchangeParams,
    params: { routingKey?: string; routingPattern?: string },
  ) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type === EExchangeType.DIRECT) {
      if (!params.routingKey) {
        return this.exchangeDirect.getBindings(exchangeParams);
      }
      return this.exchangeDirect.getRoutingKeyBoundQueues(
        exchangeParams,
        params.routingKey ?? '', // will throw an error if empty or invalid
      );
    }
    if (exchange.type === EExchangeType.TOPIC) {
      if (!params.routingPattern) {
        return this.exchangeTopic.getBindings(exchangeParams);
      }
      return this.exchangeTopic.getRoutingPatternBoundQueues(
        exchangeParams,
        params.routingPattern ?? '', // will throw an error if empty or invalid
      );
    }
    return this.exchangeFanout.getBindings(exchangeParams);
  }

  async deleteExchange(exchangeParams: IExchangeParams) {
    const exchange = await this.getExchange(exchangeParams);
    if (exchange.type === EExchangeType.DIRECT) {
      return this.exchangeDirect.delete(exchangeParams);
    }
    if (exchange.type === EExchangeType.TOPIC) {
      return this.exchangeTopic.delete(exchangeParams);
    }
    return this.exchangeFanout.delete(exchangeParams);
  }

  async getQueueExchanges(queue: IQueueParams) {
    return this.exchange.getQueueExchanges(queue);
  }

  async getNamespaceExchanges(ns: string) {
    return this.exchange.getNamespaceExchanges(ns);
  }

  async getAllExchanges() {
    return this.exchange.getAllExchanges();
  }
}
