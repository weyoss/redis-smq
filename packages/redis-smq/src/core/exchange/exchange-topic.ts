/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback } from 'redis-smq-common';
import {
  EExchangeQueuePolicy,
  EExchangeType,
  type IExchangeParams,
  type IExchangeTopic,
  type IQueueParams,
} from '../../contracts/index.js';
import { ExchangeManager } from './exchange-manager.js';

/**
 * Topic exchange facade.
 *
 * Routes by pattern matching: a message published under routing key
 * `k` reaches every queue whose binding pattern matches `k`, using
 * AMQP-style wildcards on dot-separated tokens (`*` = exactly one
 * token, `#` = zero or more tokens).
 *
 * Delegates every operation to the shared `ExchangeManager`,
 * supplying the topic-specific type where the manager needs one.
 * Callers of this class never pass a type.
 *
 * Does not expose the discovery methods (`getAllExchanges`,
 * `getNamespaceExchanges`, `getQueueExchanges`) — those describe the
 * global exchange registry, not the exchange this facade is a handle
 * for. Use `ExchangeManager` or `Exchange` for discovery.
 *
 * @example
 * const ex = new ExchangeTopic();
 * await ex.create('events', EExchangeQueuePolicy.STANDARD);
 * await ex.bindQueue('orders', 'events', 'order.*');
 * const queues = await ex.matchQueues('events', 'order.created');
 *
 * @implements {IExchangeTopic}
 */
export class ExchangeTopic implements IExchangeTopic {
  protected readonly manager = new ExchangeManager();
  protected readonly type = EExchangeType.TOPIC;

  // -------------------------------------------------------------------------
  // Lifecycle
  // -------------------------------------------------------------------------

  /** @inheritdoc */
  create(
    exchange: string | IExchangeParams,
    queuePolicy: EExchangeQueuePolicy,
  ): Promise<void>;
  /** @inheritdoc */
  create(
    exchange: string | IExchangeParams,
    queuePolicy: EExchangeQueuePolicy,
    cb: ICallback,
  ): void;
  create(
    exchange: string | IExchangeParams,
    queuePolicy: EExchangeQueuePolicy,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.create(exchange, this.type, queuePolicy, callback);
    });
  }

  /** @inheritdoc */
  delete(exchange: string | IExchangeParams): Promise<void>;
  /** @inheritdoc */
  delete(exchange: string | IExchangeParams, cb: ICallback): void;
  delete(
    exchange: string | IExchangeParams,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.delete(exchange, callback);
    });
  }

  // -------------------------------------------------------------------------
  // Bindings
  // -------------------------------------------------------------------------

  /** @inheritdoc */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
  ): Promise<void>;
  /** @inheritdoc */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
    cb: ICallback,
  ): void;
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.bindQueue(queue, exchange, routingPattern, callback);
    });
  }

  /** @inheritdoc */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
  ): Promise<void>;
  /** @inheritdoc */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
    cb: ICallback,
  ): void;
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.unbindQueue(queue, exchange, routingPattern, callback);
    });
  }

  // -------------------------------------------------------------------------
  // Matching
  // -------------------------------------------------------------------------

  /** @inheritdoc */
  matchQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
  ): Promise<IQueueParams[]>;
  /** @inheritdoc */
  matchQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback<IQueueParams[]>,
  ): void;
  matchQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.matchQueues(exchange, routingKey, callback);
    });
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  /** @inheritdoc */
  getRoutingPatterns(exchange: string | IExchangeParams): Promise<string[]>;
  /** @inheritdoc */
  getRoutingPatterns(
    exchange: string | IExchangeParams,
    cb: ICallback<string[]>,
  ): void;
  getRoutingPatterns(
    exchange: string | IExchangeParams,
    cb?: ICallback<string[]>,
  ): Promise<string[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.getRoutingPatterns(exchange, callback);
    });
  }

  /** @inheritdoc */
  getRoutingPatternBoundQueues(
    exchange: string | IExchangeParams,
    bindingPattern: string,
  ): Promise<IQueueParams[]>;
  /** @inheritdoc */
  getRoutingPatternBoundQueues(
    exchange: string | IExchangeParams,
    bindingPattern: string,
    cb: ICallback<IQueueParams[]>,
  ): void;
  getRoutingPatternBoundQueues(
    exchange: string | IExchangeParams,
    bindingPattern: string,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.getBindingQueues(exchange, bindingPattern, callback);
    });
  }

  /** @inheritdoc */
  getBindings(
    exchange: string | IExchangeParams,
  ): Promise<Record<string, IQueueParams[]>>;
  /** @inheritdoc */
  getBindings(
    exchange: string | IExchangeParams,
    cb: ICallback<Record<string, IQueueParams[]>>,
  ): void;
  getBindings(
    exchange: string | IExchangeParams,
    cb?: ICallback<Record<string, IQueueParams[]>>,
  ): Promise<Record<string, IQueueParams[]>> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.getBindings(exchange, (err, bindings) => {
        if (err) return callback(err);
        // For a topic exchange, `TExchangeBindings` is the
        // `Record<string, IQueueParams[]>` member of the union. The
        // assertion is safe as long as the caller passes a topic
        // exchange to this facade.
        callback(null, bindings as Record<string, IQueueParams[]>);
      });
    });
  }
}
