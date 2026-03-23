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
 * // Callback pattern
 * QueueOperationValidator.canConsume('my-queue', (err, canConsume) => {
 *   if (err) {
 *     console.error('Error:', err);
 *     return;
 *   }
 *   if (canConsume) {
 *     consumer.consume();
 *   }
 * });
 *
 * // Promise pattern
 * try {
 *   const canConsume = await QueueOperationValidator.canConsume('my-queue');
 *   if (canConsume) {
 *     consumer.consume();
 *   }
 * } catch (err) {
 *   console.error('Error:', err);
 * }
 * ```
 */
export class QueueOperationValidator {
  /**
   * Checks whether a specific operation is allowed on a queue.
   * Returns a boolean indicating if the operation is permitted.
   *
   * @param queue - Queue identifier (string name or IQueueParams object with namespace and name)
   * @param operation - The operation to check
   * @param cb - Optional callback function that receives (error, isAllowed)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.checkOperation(
   *   'my-queue',
   *   EQueueOperation.CONSUME,
   *   (err, isAllowed) => {
   *     if (err) {
   *       console.error('Error checking operation:', err);
   *     } else {
   *       console.log('Consume allowed:', isAllowed);
   *     }
   *   }
   * );
   *
   * // Promise pattern
   * try {
   *   const isAllowed = await QueueOperationValidator.checkOperation(
   *     'my-queue',
   *     EQueueOperation.CONSUME
   *   );
   *   console.log('Consume allowed:', isAllowed);
   * } catch (err) {
   *   console.error('Error checking operation:', err);
   * }
   * ```
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
   * Checks if messages can be consumed from the specified queue.
   * Consumption is typically only allowed when the queue is in ACTIVE state.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canConsume)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canConsume('orders-queue', (err, canConsume) => {
   *   if (err) {
   *     console.error('Error checking consume permission:', err);
   *   } else if (canConsume) {
   *     console.log('Can consume from queue');
   *     consumer.consume();
   *   } else {
   *     console.log('Queue is not in ACTIVE state');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canConsume = await QueueOperationValidator.canConsume('orders-queue');
   *   if (canConsume) {
   *     console.log('Can consume from queue');
   *     consumer.consume();
   *   } else {
   *     console.log('Queue is not in ACTIVE state');
   *   }
   * } catch (err) {
   *   console.error('Error checking consume permission:', err);
   * }
   * ```
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
   * Checks if messages can be produced/published to the specified queue.
   * Production is allowed in ACTIVE and PAUSED states, but not in STOPPED or LOCKED states.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canProduce)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canProduce('notifications-queue', (err, canProduce) => {
   *   if (err) {
   *     console.error('Error checking produce permission:', err);
   *   } else if (canProduce) {
   *     console.log('Can produce to queue');
   *     producer.produce(message);
   *   } else {
   *     console.log('Queue is stopped or locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canProduce = await QueueOperationValidator.canProduce('notifications-queue');
   *   if (canProduce) {
   *     console.log('Can produce to queue');
   *     await producer.produce(message);
   *   } else {
   *     console.log('Queue is stopped or locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking produce permission:', err);
   * }
   * ```
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
   * Queue deletion is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canDelete)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canDelete('temporary-queue', (err, canDelete) => {
   *   if (err) {
   *     console.error('Error checking delete permission:', err);
   *   } else if (canDelete) {
   *     console.log('Can delete queue');
   *     queueManager.deleteQueue('temporary-queue');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canDelete = await QueueOperationValidator.canDelete('temporary-queue');
   *   if (canDelete) {
   *     console.log('Can delete queue');
   *     await queueManager.deleteQueue('temporary-queue');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking delete permission:', err);
   * }
   * ```
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
   * Message deletion is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canDeleteMessage)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canDeleteMessage('my-queue', (err, canDelete) => {
   *   if (err) {
   *     console.error('Error checking delete message permission:', err);
   *   } else if (canDelete) {
   *     console.log('Can delete messages');
   *     messageService.deleteMessage(messageId);
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canDelete = await QueueOperationValidator.canDeleteMessage('my-queue');
   *   if (canDelete) {
   *     console.log('Can delete messages');
   *     await messageService.deleteMessage(messageId);
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking delete message permission:', err);
   * }
   * ```
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
   * Queue purging is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canPurge)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canPurge('dead-letter-queue', (err, canPurge) => {
   *   if (err) {
   *     console.error('Error checking purge permission:', err);
   *   } else if (canPurge) {
   *     console.log('Can purge queue');
   *     queueManager.purgeQueue('dead-letter-queue');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canPurge = await QueueOperationValidator.canPurge('dead-letter-queue');
   *   if (canPurge) {
   *     console.log('Can purge queue');
   *     await queueManager.purgeQueue('dead-letter-queue');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking purge permission:', err);
   * }
   * ```
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
   * Requeuing is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canRequeue)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canRequeue('failed-messages-queue', (err, canRequeue) => {
   *   if (err) {
   *     console.error('Error checking requeue permission:', err);
   *   } else if (canRequeue) {
   *     console.log('Can requeue messages');
   *     message.requeue();
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canRequeue = await QueueOperationValidator.canRequeue('failed-messages-queue');
   *   if (canRequeue) {
   *     console.log('Can requeue messages');
   *     await message.requeue();
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking requeue permission:', err);
   * }
   * ```
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
   * Rate limiting configuration is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canSetRateLimit)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canSetRateLimit('api-queue', (err, canSet) => {
   *   if (err) {
   *     console.error('Error checking rate limit permission:', err);
   *   } else if (canSet) {
   *     console.log('Can set rate limit');
   *     queueManager.setRateLimit('api-queue', { limit: 100, interval: 1000 });
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canSet = await QueueOperationValidator.canSetRateLimit('api-queue');
   *   if (canSet) {
   *     console.log('Can set rate limit');
   *     await queueManager.setRateLimit('api-queue', { limit: 100, interval: 1000 });
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking rate limit permission:', err);
   * }
   * ```
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
   * Rate limit clearing is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canClearRateLimit)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canClearRateLimit('api-queue', (err, canClear) => {
   *   if (err) {
   *     console.error('Error checking clear rate limit permission:', err);
   *   } else if (canClear) {
   *     console.log('Can clear rate limit');
   *     queueManager.clearRateLimit('api-queue');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canClear = await QueueOperationValidator.canClearRateLimit('api-queue');
   *   if (canClear) {
   *     console.log('Can clear rate limit');
   *     await queueManager.clearRateLimit('api-queue');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking clear rate limit permission:', err);
   * }
   * ```
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
   * Consumer group creation is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canCreateConsumerGroup)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canCreateConsumerGroup('orders-queue', (err, canCreate) => {
   *   if (err) {
   *     console.error('Error checking create consumer group permission:', err);
   *   } else if (canCreate) {
   *     console.log('Can create consumer group');
   *     queueManager.createConsumerGroup('orders-queue', 'group-1');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canCreate = await QueueOperationValidator.canCreateConsumerGroup('orders-queue');
   *   if (canCreate) {
   *     console.log('Can create consumer group');
   *     await queueManager.createConsumerGroup('orders-queue', 'group-1');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking create consumer group permission:', err);
   * }
   * ```
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
   * Consumer group deletion is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canDeleteConsumerGroup)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canDeleteConsumerGroup('orders-queue', (err, canDelete) => {
   *   if (err) {
   *     console.error('Error checking delete consumer group permission:', err);
   *   } else if (canDelete) {
   *     console.log('Can delete consumer group');
   *     queueManager.deleteConsumerGroup('orders-queue', 'group-1');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canDelete = await QueueOperationValidator.canDeleteConsumerGroup('orders-queue');
   *   if (canDelete) {
   *     console.log('Can delete consumer group');
   *     await queueManager.deleteConsumerGroup('orders-queue', 'group-1');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking delete consumer group permission:', err);
   * }
   * ```
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
   * Exchange binding is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canBindExchange)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canBindExchange('my-queue', (err, canBind) => {
   *   if (err) {
   *     console.error('Error checking bind exchange permission:', err);
   *   } else if (canBind) {
   *     console.log('Can bind exchange');
   *     exchangeManager.bind('my-exchange', 'my-queue', 'routing-key');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canBind = await QueueOperationValidator.canBindExchange('my-queue');
   *   if (canBind) {
   *     console.log('Can bind exchange');
   *     await exchangeManager.bind('my-exchange', 'my-queue', 'routing-key');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking bind exchange permission:', err);
   * }
   * ```
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
   * Exchange unbinding is allowed in all states except LOCKED.
   *
   * @param queue - Queue identifier (string name or IQueueParams object)
   * @param cb - Optional callback function that receives (error, canUnbindExchange)
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * QueueOperationValidator.canUnbindExchange('my-queue', (err, canUnbind) => {
   *   if (err) {
   *     console.error('Error checking unbind exchange permission:', err);
   *   } else if (canUnbind) {
   *     console.log('Can unbind exchange');
   *     exchangeManager.unbind('my-exchange', 'my-queue', 'routing-key');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const canUnbind = await QueueOperationValidator.canUnbindExchange('my-queue');
   *   if (canUnbind) {
   *     console.log('Can unbind exchange');
   *     await exchangeManager.unbind('my-exchange', 'my-queue', 'routing-key');
   *   } else {
   *     console.log('Queue is locked');
   *   }
   * } catch (err) {
   *   console.error('Error checking unbind exchange permission:', err);
   * }
   * ```
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
