/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueConsumer } from './queue-consumer.js';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
  IQueueProperties,
} from './queue.js';

/**
 * Manages queue lifecycle and metadata.
 *
 * A queue is created explicitly via `save()`; the library does not
 * auto-create queues on first publish or first consume. `save()` is the
 * only method that writes queue data. The remaining methods read or
 * delete.
 *
 * Every method that identifies a queue accepts either a bare name
 * (resolved against the configured default namespace) or a
 * `{ name, ns }` object. This is expressed via `string | IQueueParams`.
 *
 * Both the promise and callback forms are declared for every
 * asynchronous method, matching the concrete class.
 */
export interface IQueueManager {
  /**
   * Creates a new queue.
   *
   * Fails with `QueueAlreadyExistsError` if a queue with the same name
   * and namespace already exists. The queue type and delivery model are
   * fixed at creation time and cannot be changed afterwards — a queue
   * cannot be switched from FIFO to LIFO, or from POINT_TO_POINT to
   * PUB_SUB, without deleting and recreating it.
   *
   * Returns the queue's canonical parameters and its initial properties.
   *
   * @example
   * // Promise
   * const { queue, properties } = await queueManager.save(
   *   'orders',
   *   EQueueType.FIFO_QUEUE,
   *   EQueueDeliveryModel.POINT_TO_POINT,
   * );
   *
   * // Callback
   * queueManager.save(
   *   'orders',
   *   EQueueType.FIFO_QUEUE,
   *   EQueueDeliveryModel.POINT_TO_POINT,
   *   (err, result) => {
   *     if (err) throw err;
   *     console.log(result.queue);
   *   },
   * );
   */
  save(
    queue: string | IQueueParams,
    queueType: EQueueType,
    deliveryModel: EQueueDeliveryModel,
  ): Promise<{ queue: IQueueParams; properties: IQueueProperties }>;
  save(
    queue: string | IQueueParams,
    queueType: EQueueType,
    deliveryModel: EQueueDeliveryModel,
    cb: ICallback<{ queue: IQueueParams; properties: IQueueProperties }>,
  ): void;

  /**
   * Checks whether a queue exists.
   *
   * A queue exists if and only if it was successfully created via
   * `save()` and has not since been deleted.
   */
  exists(queue: string | IQueueParams): Promise<boolean>;
  exists(queue: string | IQueueParams, cb: ICallback<boolean>): void;

  /**
   * Deletes a queue and all of its associated data.
   *
   * Deletion is refused — with a specific error — in any of the following
   * cases:
   *
   *   - `QueueNotFoundError`: no such queue.
   *   - `QueueNotEmptyError`: the queue still has message records. A
   *     message record is the message's own hash (`main:msg:<id>`) and,
   *     if unacknowledgement-history audit is enabled, its history list
   *     (`main:msg:<id>:uh`). These keys live outside the queue's
   *     namespace and are not reachable from any queue-level structure,
   *     so a queue whose message records still exist cannot be deleted
   *     without orphaning them. Delete the records first — see below.
   *   - `QueueHasActiveConsumersError`: at least one consumer is still
   *     subscribed. Stop the consumers first.
   *   - `QueueHasBoundExchangesError`: at least one exchange is bound to
   *     the queue. Unbind the exchanges first.
   *   - `QueueLockedError`: the queue is in the LOCKED state.
   *
   * **Satisfying `QueueNotEmptyError`.** Processing every pending
   * message is not sufficient — acknowledgement and dead-lettering
   * transition a message's state but do not delete its hash. The
   * precondition is that the queue's `messagesCount` counter is zero,
   * and only explicit message deletion decrements that counter. There
   * are two ways to reach zero:
   *
   *   - Purge the message browsers that cover the queue's records. Which
   *     browsers apply depends on the audit configuration: with
   *     acknowledged-message audit enabled, the acknowledged records are
   *     in the acknowledged list; without it, they remain in the
   *     published list. The published list always holds every message
   *     the queue has accepted, so purging it alone reaches zero — but a
   *     queue with audit enabled also needs the acknowledged and
   *     dead-lettered lists purged, since those are separate storage.
   *
   *   - Delete the messages individually via
   *     `IMessageManager.deleteMessagesByIds`, enumerating the IDs from
   *     `QueuePublishedMessages.getMessageIds`.
   *
   * **What `delete` removes.** All queue-level state: properties,
   * pending, scheduled, delayed, requeued, acknowledged, and
   * dead-lettered message lists, per-consumer processing lists, per-
   * consumer-group pending and priority structures, exchange bindings,
   * consumer registrations, and state history. Message records are not
   * touched — by the time the deletion is allowed to proceed, none
   * remain.
   *
   * @example
   * // A queue that has never accepted a message
   * await queueManager.delete('empty-queue');
   *
   * @example
   * // A queue that has processed messages
   * const published = RedisSMQ.createQueuePublishedMessages();
   * await published.purge('orders'); // wait for the purge job to complete
   * await queueManager.delete('orders');
   */
  delete(queue: string | IQueueParams): Promise<void>;
  delete(queue: string | IQueueParams, cb: ICallback): void;

  /**
   * Returns the queue's properties.
   *
   * Properties include the queue type, delivery model, rate limit (or
   * null), all message counters, the current operational state, and
   * (for LOCKED queues) the lock ID.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist. The
   * concrete implementation currently maps a missing properties hash to
   * this same error.
   */
  getProperties(queue: string | IQueueParams): Promise<IQueueProperties>;
  getProperties(
    queue: string | IQueueParams,
    cb: ICallback<IQueueProperties>,
  ): void;

  /**
   * Returns every queue in every namespace.
   *
   * The result is a flat list of `{ name, ns }` objects. Order is
   * undefined; callers that need a stable order should sort.
   */
  getQueues(): Promise<IQueueParams[]>;
  getQueues(cb: ICallback<IQueueParams[]>): void;

  /**
   * Returns the consumers currently registered for a queue.
   *
   * The result is keyed by consumer ID. Each value carries the
   * consumer's reported network information (IP addresses, hostname,
   * PID) and the timestamp at which it registered.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist.
   * Returns an empty object if the queue exists but has no consumers.
   */
  getConsumers(
    queue: string | IQueueParams,
  ): Promise<Record<string, IQueueConsumer>>;
  getConsumers(
    queue: string | IQueueParams,
    cb: ICallback<Record<string, IQueueConsumer>>,
  ): void;

  /**
   * Returns the IDs of the consumers currently registered for a queue.
   *
   * This is a lighter-weight version of `getConsumers()`, useful when
   * only the count or the set of IDs is needed.
   *
   * Fails with `QueueNotFoundError` if the queue does not exist.
   */
  getConsumerIds(queue: string | IQueueParams): Promise<string[]>;
  getConsumerIds(queue: string | IQueueParams, cb: ICallback<string[]>): void;
}
