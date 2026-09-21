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
  type IExchangeFanout,
  type IExchangeParams,
  type IQueueParams,
} from '../../contracts/index.js';
import { ExchangeManager } from './exchange-manager.js';

/**
 * Fanout exchange facade.
 *
 * Broadcasts: a message published to a fanout exchange reaches every
 * queue bound to it, regardless of routing key. There is no key to
 * match and no pattern to apply — the exchange's binding set is the
 * entire routing table.
 *
 * Delegates every operation to the shared `ExchangeManager`,
 * supplying the fanout-specific type where the manager needs one.
 * Callers of this class never pass a type, a binding, or a routing
 * key.
 *
 * Does not expose the discovery methods (`getAllExchanges`,
 * `getNamespaceExchanges`, `getQueueExchanges`) — those describe the
 * global exchange registry, not the exchange this facade is a handle
 * for. Use `ExchangeManager` or `Exchange` for discovery.
 *
 * @example
 * const ex = new ExchangeFanout();
 * await ex.create('broadcast', EExchangeQueuePolicy.STANDARD);
 * await ex.bindQueue('notifications', 'broadcast');
 * const queues = await ex.matchQueues('broadcast');
 *
 * @implements {IExchangeFanout}
 */
export class ExchangeFanout implements IExchangeFanout {
  protected readonly manager = new ExchangeManager();
  protected readonly type = EExchangeType.FANOUT;

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
  ): Promise<void>;
  /** @inheritdoc */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    cb: ICallback,
  ): void;
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.bindQueue(queue, exchange, callback);
    });
  }

  /** @inheritdoc */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
  ): Promise<void>;
  /** @inheritdoc */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    cb: ICallback,
  ): void;
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.unbindQueue(queue, exchange, callback);
    });
  }

  // -------------------------------------------------------------------------
  // Matching
  // -------------------------------------------------------------------------

  /** @inheritdoc */
  matchQueues(exchange: string | IExchangeParams): Promise<IQueueParams[]>;
  /** @inheritdoc */
  matchQueues(
    exchange: string | IExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;
  matchQueues(
    exchange: string | IExchangeParams,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.matchQueues(exchange, callback);
    });
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  /** @inheritdoc */
  getBindings(exchange: string | IExchangeParams): Promise<IQueueParams[]>;
  /** @inheritdoc */
  getBindings(
    exchange: string | IExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;
  getBindings(
    exchange: string | IExchangeParams,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.manager.getBindings(exchange, (err, bindings) => {
        if (err) return callback(err);
        // For a fanout exchange, `TExchangeBindings` is the
        // `IQueueParams[]` member of the union. The assertion is safe
        // as long as the caller passes a fanout exchange to this
        // facade.
        callback(null, bindings as IQueueParams[]);
      });
    });
  }
}
