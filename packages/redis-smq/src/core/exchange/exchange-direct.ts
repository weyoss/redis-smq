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
  type IExchangeDirect,
  type IExchangeParams,
  type IQueueParams,
} from '../../contracts/index.js';
import { ExchangeManager } from './exchange-manager.js';

/**
 * Direct exchange facade.
 *
 * Routes by exact routing key match. Delegates every operation to the
 * shared `ExchangeManager`, supplying the direct-specific type where
 * the manager needs one. Callers of this class never pass a type.
 *
 * Does not expose the discovery methods (`getAllExchanges`,
 * `getNamespaceExchanges`, `getQueueExchanges`) — those describe the
 * global exchange registry, not the exchange this facade is a handle
 * for. Use `ExchangeManager` or `Exchange` for discovery.
 *
 * @example
 * const ex = new ExchangeDirect();
 * await ex.create('events', EExchangeQueuePolicy.STANDARD);
 * await ex.bindQueue('orders', 'events', 'order.created');
 * const queues = await ex.matchQueues('events', 'order.created');
 *
 * @implements {IExchangeDirect}
 */
export class ExchangeDirect implements IExchangeDirect {
  protected readonly manager = new ExchangeManager();
  protected readonly type = EExchangeType.DIRECT;

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
    routingKey: string,
  ): Promise<void>;
  /** @inheritdoc */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback,
  ): void;
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.bindQueue(queue, exchange, routingKey, callback);
    });
  }

  /** @inheritdoc */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
  ): Promise<void>;
  /** @inheritdoc */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback,
  ): void;
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.unbindQueue(queue, exchange, routingKey, callback);
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
  getRoutingKeys(exchange: string | IExchangeParams): Promise<string[]>;
  /** @inheritdoc */
  getRoutingKeys(
    exchange: string | IExchangeParams,
    cb: ICallback<string[]>,
  ): void;
  getRoutingKeys(
    exchange: string | IExchangeParams,
    cb?: ICallback<string[]>,
  ): Promise<string[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.getRoutingKeys(exchange, callback);
    });
  }

  /** @inheritdoc */
  getRoutingKeyBoundQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
  ): Promise<IQueueParams[]>;
  /** @inheritdoc */
  getRoutingKeyBoundQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback<IQueueParams[]>,
  ): void;
  getRoutingKeyBoundQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.getBindingQueues(exchange, routingKey, callback);
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
        // For a direct exchange, `TExchangeBindings` is the
        // `Record<string, IQueueParams[]>` member of the union. The
        // assertion is safe as long as the caller passes a direct
        // exchange to this facade.
        callback(null, bindings as Record<string, IQueueParams[]>);
      });
    });
  }
}
