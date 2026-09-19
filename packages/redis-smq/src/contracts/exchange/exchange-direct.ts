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
 * Direct exchange: routes messages by exact routing key match.
 *
 * A message published to a direct exchange with routing key `k` is
 * delivered to every queue bound to that exchange with the same key `k`.
 * Binding with a different key does not receive the message — there is
 * no prefix matching, no wildcards, no fan-out.
 *
 * Direct exchange is the correct choice when the set of routing keys is
 * known ahead of time and each message has exactly one intended
 * destination, or a small, well-defined set of destinations.
 *
 * Extends `IExchange` for the read-only discovery methods
 * (`getAllExchanges`, `getNamespaceExchanges`, `getQueueExchanges`).
 * This interface adds the direct-specific operations.
 *
 * Both the promise and callback forms are declared for every
 * asynchronous method, matching the concrete class.
 *
 * @example
 * const directExchange = new ExchangeDirect();
 *
 * // Bind a queue to a routing key
 * await directExchange.bindQueue('order-processor', 'events', 'order.created');
 *
 * // Resolve the queues a routing key delivers to
 * const queues = await directExchange.matchQueues('events', 'order.created');
 */
export interface IExchangeDirect {
  /**
   * Creates a direct exchange.
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
   * Deletes a direct exchange.
   *
   * Deletion is refused with `ExchangeHasBoundQueuesError` while any
   * queue is still bound to the exchange. Unbind every queue first.
   *
   * Once the exchange is deleted, its routing keys and binding sets are
   * removed. The queues that were bound remain in place; only the
   * binding is gone.
   */
  delete(exchange: string | IExchangeParams): Promise<void>;
  delete(exchange: string | IExchangeParams, cb: ICallback): void;

  /**
   * Binds a queue to the exchange under a routing key.
   *
   * The queue's namespace must match the exchange's namespace — a
   * cross-namespace binding fails with `NamespaceMismatchError`. The
   * queue's type must match the exchange's queue policy; a mismatch
   * fails with `ExchangeQueuePolicyMismatchError`.
   *
   * Binding a queue that is already bound under the same routing key is
   * a no-op (with a debug log), not an error. Rebinding under a
   * different key is allowed — a queue can be bound to the same exchange
   * under multiple routing keys.
   */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
  ): Promise<void>;
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback,
  ): void;

  /**
   * Unbinds a queue from the exchange under a routing key.
   *
   * The binding must exist: unbinding a queue that is not bound under
   * the given key fails with `QueueNotBoundError`.
   *
   * If the queue is bound under other routing keys on the same exchange,
   * those bindings remain in place. Only the specified key is removed.
   *
   * If the specified key was the last binding for the exchange, the key
   * itself is removed from the exchange's routing key set. If the last
   * binding for the queue was on this exchange across all keys, the
   * exchange is removed from the queue's binding list.
   */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
  ): Promise<void>;
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback,
  ): void;

  /**
   * Returns the queues a message with the given routing key would be
   * delivered to.
   *
   * Used by the producer at publish time to resolve the exchange's
   * targets. Performs an exact-match lookup on the routing key — the
   * same lookup that `bindQueue` writes to.
   *
   * Returns an empty array if the exchange exists but no queue is bound
   * under the routing key. Fails with `ExchangeNotFoundError` if the
   * exchange does not exist at all.
   *
   * The two cases — empty result and missing exchange — are distinct.
   * A producer that wants to distinguish "no matching queue" from "no
   * such exchange" inspects the error. The producer's normal path treats
   * both as "nothing to deliver" and raises `NoMatchingQueuesError`.
   */
  matchQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
  ): Promise<IQueueParams[]>;
  matchQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback<IQueueParams[]>,
  ): void;

  /**
   * Returns every routing key registered on the exchange.
   *
   * A routing key is registered when at least one queue is bound under
   * it. Removing the last queue bound to a key removes the key from the
   * set. The result is a flat list of strings; order is undefined.
   *
   * Returns an empty array if the exchange exists but has no bindings,
   * or if the exchange does not exist. Unlike `matchQueues`, this method
   * does not distinguish the two cases — it returns an empty list
   * either way.
   */
  getRoutingKeys(exchange: string | IExchangeParams): Promise<string[]>;
  getRoutingKeys(
    exchange: string | IExchangeParams,
    cb: ICallback<string[]>,
  ): void;

  /**
   * Returns every queue bound to the exchange under a specific routing
   * key.
   *
   * Symmetric with `matchQueues` but named for the query perspective:
   * `matchQueues` describes the producer's question ("where does this
   * go?"), `getRoutingKeyBoundQueues` describes the caller's question
   * ("who is listening to this key?"). Both perform the same lookup.
   *
   * Returns an empty array if the key has no bound queues. Fails with
   * `InvalidDirectExchangeParametersError` if the routing key is not a
   * valid Redis key (empty, too long, or containing forbidden
   * characters).
   */
  getRoutingKeyBoundQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
  ): Promise<IQueueParams[]>;
  getRoutingKeyBoundQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback<IQueueParams[]>,
  ): void;

  /**
   * Returns the exchange's complete binding map.
   *
   * The result is a `Record<string, IQueueParams[]>` whose keys are
   * routing keys and whose values are the queues bound under each key.
   * A routing key with no queues never appears as a key — the map only
   * lists keys that have at least one binding.
   *
   * Order of keys and of queues within each key is undefined.
   *
   * This is a snapshot: it reads the routing key set, then reads each
   * key's bound queues in sequence. A binding added or removed while the
   * snapshot is being taken may or may not appear in the result,
   * depending on the order of the underlying reads. Callers who need a
   * consistent view should use a lock (queue state LOCKED) or accept the
   * inherent raciness of a multi-key read.
   */
  getBindings(
    exchange: string | IExchangeParams,
  ): Promise<Record<string, IQueueParams[]>>;
  getBindings(
    exchange: string | IExchangeParams,
    cb: ICallback<Record<string, IQueueParams[]>>,
  ): void;
}
