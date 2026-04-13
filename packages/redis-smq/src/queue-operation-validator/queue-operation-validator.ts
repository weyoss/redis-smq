/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, ICallback } from 'redis-smq-common';
import { IQueueParams } from '../queue-manager/index.js';
import { EQueueOperation } from './types/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { _checkOperation } from './_/_check-operation.js';

/**
 * Validates allowed operations on queues based on their state.
 *
 * Queue states and allowed operations:
 * - ACTIVE: All operations
 * - PAUSED: All operations except CONSUME
 * - STOPPED: Only management operations (purge, delete, rate limits, consumer groups, exchanges)
 * - LOCKED: No operations allowed
 *
 * @example
 * const canConsume = await QueueOperationValidator.canConsume('orders');
 * if (canConsume) {
 *   await consumer.consume('orders', handler);
 * }
 */
export class QueueOperationValidator {
  /**
   * Checks if a specific operation is allowed on a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param operation - Operation to check
   * @param cb - (err, isAllowed) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   * @internal
   */
  protected static checkOperation(
    queue: string | IQueueParams,
    operation: EQueueOperation,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) return callback(queueParams);

      withSharedPoolConnection((client, cb) => {
        _checkOperation(client, queueParams, operation, (err, result) =>
          cb(err, result?.allowed),
        );
      }, callback);
    });
  }

  /**
   * Checks if messages can be consumed from the queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canConsume) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canConsume = await QueueOperationValidator.canConsume('orders');
   *
   * // Callback
   * QueueOperationValidator.canConsume('orders', (err, canConsume) => {
   *   if (err) throw err;
   *   console.log(canConsume);
   * });
   */
  static canConsume(queue: string | IQueueParams): Promise<boolean>;
  static canConsume(queue: string | IQueueParams, cb: ICallback<boolean>): void;
  static canConsume(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(queue, EQueueOperation.CONSUME, cb);
  }

  /**
   * Checks if messages can be produced to the queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canProduce) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canProduce = await QueueOperationValidator.canProduce('orders');
   *
   * // Callback
   * QueueOperationValidator.canProduce('orders', (err, canProduce) => {
   *   if (err) throw err;
   *   console.log(canProduce);
   * });
   */
  static canProduce(queue: string | IQueueParams): Promise<boolean>;
  static canProduce(queue: string | IQueueParams, cb: ICallback<boolean>): void;
  static canProduce(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(queue, EQueueOperation.PRODUCE, cb);
  }

  /**
   * Checks if the queue can be deleted.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canDelete) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canDelete = await QueueOperationValidator.canDelete('orders');
   *
   * // Callback
   * QueueOperationValidator.canDelete('orders', (err, canDelete) => {
   *   if (err) throw err;
   *   console.log(canDelete);
   * });
   */
  static canDelete(queue: string | IQueueParams): Promise<boolean>;
  static canDelete(queue: string | IQueueParams, cb: ICallback<boolean>): void;
  static canDelete(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(queue, EQueueOperation.DELETE, cb);
  }

  /**
   * Checks if messages can be deleted from the queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canDeleteMessage) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canDelete = await QueueOperationValidator.canDeleteMessage('orders');
   *
   * // Callback
   * QueueOperationValidator.canDeleteMessage('orders', (err, canDelete) => {
   *   if (err) throw err;
   *   console.log(canDelete);
   * });
   */
  static canDeleteMessage(queue: string | IQueueParams): Promise<boolean>;
  static canDeleteMessage(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ): void;
  static canDeleteMessage(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(queue, EQueueOperation.DELETE_MESSAGE, cb);
  }

  /**
   * Checks if the queue can be purged (all messages removed).
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canPurge) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canPurge = await QueueOperationValidator.canPurge('orders');
   *
   * // Callback
   * QueueOperationValidator.canPurge('orders', (err, canPurge) => {
   *   if (err) throw err;
   *   console.log(canPurge);
   * });
   */
  static canPurge(queue: string | IQueueParams): Promise<boolean>;
  static canPurge(queue: string | IQueueParams, cb: ICallback<boolean>): void;
  static canPurge(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(queue, EQueueOperation.PURGE, cb);
  }

  /**
   * Checks if messages can be requeued for reprocessing.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canRequeue) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canRequeue = await QueueOperationValidator.canRequeue('orders');
   *
   * // Callback
   * QueueOperationValidator.canRequeue('orders', (err, canRequeue) => {
   *   if (err) throw err;
   *   console.log(canRequeue);
   * });
   */
  static canRequeue(queue: string | IQueueParams): Promise<boolean>;
  static canRequeue(queue: string | IQueueParams, cb: ICallback<boolean>): void;
  static canRequeue(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(queue, EQueueOperation.REQUEUE_MESSAGE, cb);
  }

  /**
   * Checks if a rate limit can be set on the queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canSetRateLimit) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canSet = await QueueOperationValidator.canSetRateLimit('orders');
   *
   * // Callback
   * QueueOperationValidator.canSetRateLimit('orders', (err, canSet) => {
   *   if (err) throw err;
   *   console.log(canSet);
   * });
   */
  static canSetRateLimit(queue: string | IQueueParams): Promise<boolean>;
  static canSetRateLimit(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ): void;
  static canSetRateLimit(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(queue, EQueueOperation.SET_RATE_LIMIT, cb);
  }

  /**
   * Checks if the rate limit can be cleared from the queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canClearRateLimit) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canClear = await QueueOperationValidator.canClearRateLimit('orders');
   *
   * // Callback
   * QueueOperationValidator.canClearRateLimit('orders', (err, canClear) => {
   *   if (err) throw err;
   *   console.log(canClear);
   * });
   */
  static canClearRateLimit(queue: string | IQueueParams): Promise<boolean>;
  static canClearRateLimit(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ): void;
  static canClearRateLimit(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(queue, EQueueOperation.CLEAR_RATE_LIMIT, cb);
  }

  /**
   * Checks if a consumer group can be created for the queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canCreateConsumerGroup) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canCreate = await QueueOperationValidator.canCreateConsumerGroup('orders');
   *
   * // Callback
   * QueueOperationValidator.canCreateConsumerGroup('orders', (err, canCreate) => {
   *   if (err) throw err;
   *   console.log(canCreate);
   * });
   */
  static canCreateConsumerGroup(queue: string | IQueueParams): Promise<boolean>;
  static canCreateConsumerGroup(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ): void;
  static canCreateConsumerGroup(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(
      queue,
      EQueueOperation.CREATE_CONSUMER_GROUP,
      cb,
    );
  }

  /**
   * Checks if a consumer group can be deleted from the queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canDeleteConsumerGroup) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canDelete = await QueueOperationValidator.canDeleteConsumerGroup('orders');
   *
   * // Callback
   * QueueOperationValidator.canDeleteConsumerGroup('orders', (err, canDelete) => {
   *   if (err) throw err;
   *   console.log(canDelete);
   * });
   */
  static canDeleteConsumerGroup(queue: string | IQueueParams): Promise<boolean>;
  static canDeleteConsumerGroup(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ): void;
  static canDeleteConsumerGroup(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(
      queue,
      EQueueOperation.DELETE_CONSUMER_GROUP,
      cb,
    );
  }

  /**
   * Checks if an exchange can be bound to the queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canBindExchange) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canBind = await QueueOperationValidator.canBindExchange('orders');
   *
   * // Callback
   * QueueOperationValidator.canBindExchange('orders', (err, canBind) => {
   *   if (err) throw err;
   *   console.log(canBind);
   * });
   */
  static canBindExchange(queue: string | IQueueParams): Promise<boolean>;
  static canBindExchange(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ): void;
  static canBindExchange(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(queue, EQueueOperation.BIND_EXCHANGE, cb);
  }

  /**
   * Checks if an exchange can be unbound from the queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, canUnbindExchange) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const canUnbind = await QueueOperationValidator.canUnbindExchange('orders');
   *
   * // Callback
   * QueueOperationValidator.canUnbindExchange('orders', (err, canUnbind) => {
   *   if (err) throw err;
   *   console.log(canUnbind);
   * });
   */
  static canUnbindExchange(queue: string | IQueueParams): Promise<boolean>;
  static canUnbindExchange(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ): void;
  static canUnbindExchange(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return this.checkOperation(queue, EQueueOperation.UNBIND_EXCHANGE, cb);
  }
}
