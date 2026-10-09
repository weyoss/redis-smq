/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../queue-manager/queue.js';
import { EExchangeQueuePolicy, IExchangeParams } from './exchange-types.js';

/**
 * Fanout exchange: broadcasts messages to every bound queue.
 *
 * A message published to a fanout exchange is delivered to every queue
 * bound to it, regardless of any routing key. There is no key to match
 * and no pattern to apply — the exchange's binding set is the entire
 * routing table.
 *
 * Fanout is the correct choice for pub/sub fan-out where every consumer
 * of an event should receive it, and where adding or removing a
 * consumer is a matter of binding or unbinding a queue rather than
 * coordinating routing keys.
 *
 * Extends `IExchange` for the read-only discovery methods
 * (`getAllExchanges`, `getNamespaceExchanges`, `getQueueExchanges`).
 * This interface adds the fanout-specific operations.
 *
 * Both the promise and callback forms are declared for every
 * asynchronous method, matching the concrete class.
 *
 * @example
 * const fanout = new ExchangeFanout();
 *
 * // Bind a queue to the exchange
 * await fanout.bindQueue('notifications', 'broadcast');
 *
 * // Resolve every queue the exchange delivers to
 * const queues = await fanout.matchQueues('broadcast');
 */
export interface IExchangeFanout {
  /**
   * Creates a fanout exchange.
   *
   * The queue policy is fixed at creation time and cannot be changed.
   * Every subsequent `bindQueue` for this exchange must target a queue
   * whose type matches the policy; binding a queue of the wrong category
   * fails with `ExchangeQueuePolicyMismatchError`.
   *
   * Creating an exchange that already exists fails with
   * `ExchangeAlreadyExistsError`.
   *
   * @param exchange - Exchange name or `{ name, ns }`. A bare name is
   *   resolved against the configured default namespace.
   * @param queuePolicy - STANDARD (FIFO and LIFO queues) or PRIORITY
   *   (PRIORITY_QUEUE queues).
   */
  create(
    exchange: string | IExchangeParams,
    queuePolicy: EExchangeQueuePolicy,
  ): Promise<void>;
  create(
    exchange: string | IExchangeParams,
    queuePolicy: EExchangeQueuePolicy,
    cb: ICallback,
  ): void;

  /**
   * Deletes a fanout exchange.
   *
   * Deletion is refused with `ExchangeHasBoundQueuesError` while any
   * queue is still bound to the exchange. Unbind every queue first.
   *
   * Once the exchange is deleted, its binding set is removed. The queues
   * that were bound remain in place; only the binding is gone.
   */
  delete(exchange: string | IExchangeParams): Promise<void>;
  delete(exchange: string | IExchangeParams, cb: ICallback): void;

  /**
   * Binds a queue to the exchange.
   *
   * The queue's namespace must match the exchange's namespace — a
   * cross-namespace binding fails with `NamespaceMismatchError`. The
   * queue's type must match the exchange's queue policy; a mismatch
   * fails with `ExchangeQueuePolicyMismatchError`.
   *
   * Binding a queue that is already bound is a no-op (with a debug log),
   * not an error. There is no routing key — a queue is either bound to a
   * fanout exchange or it is not, and the binding carries no additional
   * information.
   */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
  ): Promise<void>;
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    cb: ICallback,
  ): void;

  /**
   * Unbinds a queue from the exchange.
   *
   * The binding must exist: unbinding a queue that is not bound fails
   * with `QueueNotBoundError`.
   *
   * If the queue was bound to other exchanges, those bindings remain in
   * place. Only this exchange's binding set is affected.
   */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
  ): Promise<void>;
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    cb: ICallback,
  ): void;

  /**
   * Returns every queue the exchange delivers to.
   *
   * For a fanout exchange this is the entire routing table — the set of
   * queues bound to the exchange. There is no key or pattern to filter
   * by.
   *
   * Returns an empty array if the exchange exists but has no bound
   * queues, or if the exchange does not exist at all. The two cases are
   * not distinguished. Callers that need to know whether the exchange
   * exists should call `getAllExchanges` or `getNamespaceExchanges` and
   * check for the exchange's presence in the result.
   *
   * Order of the returned queues is undefined.
   */
  getBindings(exchange: string | IExchangeParams): Promise<IQueueParams[]>;
  getBindings(
    exchange: string | IExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;

  /**
   * Returns every queue the exchange delivers to.
   *
   * For a fanout exchange this is the entire routing table — the set of
   * queues bound to the exchange. There is no key or pattern to filter
   * by.
   *
   * `matchQueues` is the name the producer uses when resolving an
   * exchange's targets; `getBindings` is the name an operator uses when
   * inspecting the exchange. Both return the same list for an existing
   * exchange. A missing exchange rejects with `ExchangeNotFoundError`.
   *
   * Order of the returned queues is undefined.
   */
  matchQueues(exchange: string | IExchangeParams): Promise<IQueueParams[]>;
  matchQueues(
    exchange: string | IExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;
}
