/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { IQueueParams } from '../queue-manager/index.js';
import { EQueueOperation } from './types/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { _checkOperation } from './_/_check-operation.js';

/**
 * Utility class for validating and checking allowed operations on queues based on their operational state.
 *
 * The QueueOperationValidator provides methods to determine whether specific operations are permitted
 * on a queue given its current state (ACTIVE, PAUSED, STOPPED, or LOCKED). Each queue state has a
 * predefined set of allowed operations defined in the operation registry.
 *
 * Features:
 * - Validate operations with error callbacks when operations are not allowed
 * - Check operations with boolean results for conditional logic
 * - Support for checking single or multiple operations at once
 *
 * Queue States and Allowed Operations:
 * - ACTIVE: All operations including consume, produce, and management
 * - PAUSED: All operations except CONSUME
 * - STOPPED: Only management operations (purge, delete, rate limits, consumer groups, exchanges)
 * - LOCKED: No operations allowed
 *
 * @example
 * ```typescript
 * // Check if messages can be consumed
 * QueueOperationValidator.canConsume('my-queue', (err, canConsume) => {
 *   if (err) {
 *     console.error('Error:', err);
 *     return;
 *   }
 *
 *   if (canConsume) {
 *     // Proceed with message consumption
 *   }
 * });
 * ```
 */
export class QueueOperationValidator {
  /**
   * Checks whether a specific operation is allowed on a queue.
   * Returns a boolean indicating if the operation is permitted.
   *
   * @param queue - Queue identifier (string name or IQueueParams object with namespace and name)
   * @param operation - The operation to check
   * @param cb - Callback function that receives (error, isAllowed)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.checkOperation(
   *   'my-queue',
   *   EQueueOperation.CONSUME,
   *   (err, isAllowed) => {
   *     if (err) {
   *       console.error('Error checking operation:', err);
   *       return;
   *     }
   *     console.log('Consume allowed:', isAllowed);
   *   }
   * );
   * ```
   */
  protected static checkOperation(
    queue: string | IQueueParams,
    operation: EQueueOperation,
    cb: ICallback<boolean>,
  ): void {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) return cb(queueParams);

    withSharedPoolConnection((client, cb) => {
      _checkOperation(client, queueParams, operation, cb);
    }, cb);
  }

  /**
   * Checks if messages can be consumed from the specified queue.
   * Consumption is typically only allowed when the queue is in ACTIVE state.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canConsume)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canConsume('orders-queue', (err, canConsume) => {
   *   if (canConsume) {
   *     consumer.consume();
   *   }
   * });
   * ```
   */
  static canConsume(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.CONSUME, cb);
  }

  /**
   * Checks if messages can be produced/published to the specified queue.
   * Production is allowed in ACTIVE and PAUSED states, but not in STOPPED or LOCKED states.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canProduce)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canProduce('notifications-queue', (err, canProduce) => {
   *   if (canProduce) {
   *     producer.produce(message);
   *   } else {
   *     console.log('Queue is not accepting messages');
   *   }
   * });
   * ```
   */
  static canProduce(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.PRODUCE, cb);
  }

  /**
   * Checks if the queue can be deleted.
   * Queue deletion is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canDelete)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canDelete('temporary-queue', (err, canDelete) => {
   *   if (canDelete) {
   *     queueManager.deleteQueue('temporary-queue');
   *   }
   * });
   * ```
   */
  static canDelete(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.DELETE, cb);
  }

  /**
   * Checks if messages can be deleted from the queue.
   * Message deletion is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canDeleteMessage)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canDeleteMessage('my-queue', (err, canDelete) => {
   *   if (canDelete) {
   *     messageService.deleteMessage(messageId);
   *   }
   * });
   * ```
   */
  static canDeleteMessage(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ) {
    this.checkOperation(queue, EQueueOperation.DELETE_MESSAGE, cb);
  }

  /**
   * Checks if the queue can be purged (all messages removed).
   * Queue purging is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canPurge)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canPurge('dead-letter-queue', (err, canPurge) => {
   *   if (canPurge) {
   *     queueManager.purgeQueue('dead-letter-queue');
   *   }
   * });
   * ```
   */
  static canPurge(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.PURGE, cb);
  }

  /**
   * Checks if messages can be requeued for reprocessing.
   * Requeuing is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canRequeue)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canRequeue('failed-messages-queue', (err, canRequeue) => {
   *   if (canRequeue) {
   *     message.requeue();
   *   }
   * });
   * ```
   */
  static canRequeue(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.REQUEUE_MESSAGE, cb);
  }

  /**
   * Checks if a rate limit can be set on the queue.
   * Rate limiting configuration is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canSetRateLimit)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canSetRateLimit('api-queue', (err, canSet) => {
   *   if (canSet) {
   *     queueManager.setRateLimit('api-queue', { limit: 100, interval: 1000 });
   *   }
   * });
   * ```
   */
  static canSetRateLimit(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.SET_RATE_LIMIT, cb);
  }

  /**
   * Checks if the rate limit can be cleared from the queue.
   * Rate limit clearing is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canClearRateLimit)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canClearRateLimit('api-queue', (err, canClear) => {
   *   if (canClear) {
   *     queueManager.clearRateLimit('api-queue');
   *   }
   * });
   * ```
   */
  static canClearRateLimit(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ) {
    this.checkOperation(queue, EQueueOperation.CLEAR_RATE_LIMIT, cb);
  }

  /**
   * Checks if a consumer group can be created for the queue.
   * Consumer group creation is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canCreateConsumerGroup)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canCreateConsumerGroup('orders-queue', (err, canCreate) => {
   *   if (canCreate) {
   *     queueManager.createConsumerGroup('orders-queue', 'group-1');
   *   }
   * });
   * ```
   */
  static canCreateConsumerGroup(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ) {
    this.checkOperation(queue, EQueueOperation.CREATE_CONSUMER_GROUP, cb);
  }

  /**
   * Checks if a consumer group can be deleted from the queue.
   * Consumer group deletion is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canDeleteConsumerGroup)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canDeleteConsumerGroup('orders-queue', (err, canDelete) => {
   *   if (canDelete) {
   *     queueManager.deleteConsumerGroup('orders-queue', 'group-1');
   *   }
   * });
   * ```
   */
  static canDeleteConsumerGroup(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ) {
    this.checkOperation(queue, EQueueOperation.DELETE_CONSUMER_GROUP, cb);
  }

  /**
   * Checks if an exchange can be bound to the queue.
   * Exchange binding is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canBindExchange)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canBindExchange('my-queue', (err, canBind) => {
   *   if (canBind) {
   *     exchangeManager.bind('my-exchange', 'my-queue', 'routing-key');
   *   }
   * });
   * ```
   */
  static canBindExchange(queue: string | IQueueParams, cb: ICallback<boolean>) {
    this.checkOperation(queue, EQueueOperation.BIND_EXCHANGE, cb);
  }

  /**
   * Checks if an exchange can be unbound from the queue.
   * Exchange unbinding is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Callback function that receives (error, canUnbindExchange)
   *
   * @example
   * ```typescript
   * QueueOperationValidator.canUnbindExchange('my-queue', (err, canUnbind) => {
   *   if (canUnbind) {
   *     exchangeManager.unbind('my-exchange', 'my-queue', 'routing-key');
   *   }
   * });
   * ```
   */
  static canUnbindExchange(
    queue: string | IQueueParams,
    cb: ICallback<boolean>,
  ) {
    this.checkOperation(queue, EQueueOperation.UNBIND_EXCHANGE, cb);
  }
}
