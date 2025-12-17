/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  async,
  CallbackEmptyReplyError,
  createLogger,
  ICallback,
  IWatchTransactionAttemptResult,
  withWatchTransaction,
} from 'redis-smq-common';
import { withSharedPoolConnection } from '../../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import {
  ExchangeHasBoundQueuesError,
  InvalidFanoutExchangeParametersError,
  NamespaceMismatchError,
  QueueAlreadyBound,
  QueueNotBoundError,
} from '../../errors/index.js';
import { _parseQueueParams } from '../../queue-manager/_/_parse-queue-params.js';
import { EQueueType, IQueueParams } from '../../queue-manager/index.js';
import { _parseExchangeParams } from '../_/_parse-exchange-params.js';
import { _saveExchange } from '../_/_save-exchange.js';
import { _validateQueueBinding } from '../_/_validate-queue-binding.js';
import { _validateExchange } from '../_/_validate-exchange.js';
import {
  EExchangeProperty,
  EExchangeQueuePolicy,
  EExchangeType,
  IExchangeParams,
} from '../types/index.js';
import { _getExchangeFanoutBoundQueues } from './_/_get-exchange-fanout-bound-queues.js';

/**
 * Fanout Exchange implementation for RedisSMQ.
 *
 * A fanout exchange routes messages to all queues that are bound to it, ignoring routing keys.
 * This is useful for broadcasting messages to multiple consumers or implementing pub/sub patterns.
 *
 * Features:
 * - Message broadcasting to all bound queues
 * - Atomic queue binding and unbinding operations
 * - Concurrent modification detection using Redis WATCH
 * - Namespace isolation for multi-tenant applications
 * - Comprehensive error handling and validation
 *
 * @example
 * ```typescript
 * const fanoutExchange = new ExchangeFanout();
 *
 * // Bind queues to the exchange
 * fanoutExchange.bindQueue('notifications', 'broadcast-exchange', (err) => {
 *   if (err) {
 *     console.error('Failed to bind queue:', err);
 *     return;
 *   }
 *   console.log('Queue bound successfully');
 * });
 *
 * // Get all bound queues
 * fanoutExchange.matchQueues('broadcast-exchange', (err, queues) => {
 *   if (err) {
 *     console.error('Failed to get bound queues:', err);
 *     return;
 *   }
 *   console.log('Bound queues:', queues);
 * });
 * ```
 */
export class ExchangeFanout {
  protected readonly type = EExchangeType.FANOUT;
  protected logger;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name,
    );
  }

  /**
   * Retrieves all queues bound to the specified fanout exchange.
   *
   * This method returns all queues that are currently bound to the fanout exchange.
   * In a fanout exchange, messages are delivered to all bound queues regardless
   * of routing keys, making this method useful for understanding message distribution.
   *
   * @param exchange - The exchange identifier. Can be a string (exchange name) or
   *                  an object with name and namespace properties. If namespace is
   *                  not specified, the default namespace from configuration is used.
   * @param cb - Callback function called with the list of bound queues or an error
   *
   * @throws {InvalidExchangeParametersError} When exchange parameters are invalid
   * @throws {Error} When Redis operations fail
   *
   * @example
   * ```typescript
   * const fanoutExchange = new ExchangeFanout();
   *
   * // Get bound queues using exchange name
   * fanoutExchange.matchQueues('broadcast-exchange', (err, queues) => {
   *   if (err) {
   *     console.error('Failed to get bound queues:', err);
   *     return;
   *   }
   *
   *   console.log(`Found ${queues.length} bound queues:`);
   *   queues.forEach(queue => {
   *     console.log(`- Queue: ${queue.name} (namespace: ${queue.ns})`);
   *   });
   * });
   *
   * // Get bound queues using exchange object with namespace
   * fanoutExchange.matchQueues(
   *   { name: 'broadcast-exchange', ns: 'production' },
   *   (err, queues) => {
   *     if (!err) {
   *       console.log('Production queues:', queues);
   *     }
   *   }
   * );
   * ```
   */
  matchQueues(
    exchange: string | IExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void {
    const exchangeParams = _parseExchangeParams(exchange, this.type);
    if (exchangeParams instanceof Error) return cb(exchangeParams);
    withSharedPoolConnection(
      (client, cb) => _getExchangeFanoutBoundQueues(client, exchangeParams, cb),
      cb,
    );
  }

  create(
    exchange: string | IExchangeParams,
    queuePolicy: EExchangeQueuePolicy,
    cb: ICallback,
  ) {
    const exchangeParams = _parseExchangeParams(exchange, this.type);
    if (exchangeParams instanceof Error)
      return cb(new InvalidFanoutExchangeParametersError());
    withSharedPoolConnection(
      (client, cb) => _saveExchange(client, exchangeParams, queuePolicy, cb),
      cb,
    );
  }

  /**
   * Deletes a fanout exchange from the system.
   *
   * @param exchange - The exchange identifier. Can be a string (exchange name) or
   *                  an object with name and namespace properties.
   * @param cb - Callback function called when the deletion completes
   *
   * @throws {InvalidExchangeParametersError} When exchange parameters are invalid
   * @throws {ExchangeError} When the exchange is not found or type mismatch occurs
   * @throws {ExchangeHasBoundQueuesError} When the exchange still has bound queues
   * @throws {Error} When Redis operations fail or concurrent modifications are detected
   *
   * @example
   * ```typescript
   * const fanoutExchange = new ExchangeFanout();
   *
   * // Delete an exchange (must have no bound queues)
   * fanoutExchange.delete('old-broadcast-exchange', (err) => {
   *   if (err) {
   *     if (err instanceof ExchangeHasBoundQueuesError) {
   *       console.error('Cannot delete: exchange has bound queues');
   *       // Unbind all queues first, then retry deletion
   *     } else if (err instanceof ExchangeError) {
   *       console.error('Exchange not found or invalid type');
   *     } else {
   *       console.error('Deletion failed:', err);
   *     }
   *     return;
   *   }
   *
   *   console.log('Exchange deleted successfully');
   * });
   *
   * // Delete exchange with specific namespace
   * fanoutExchange.delete(
   *   { name: 'temp-exchange', ns: 'testing' },
   *   (err) => {
   *     if (!err) console.log('Testing exchange deleted');
   *   }
   * );
   * ```
   */
  delete(exchange: string | IExchangeParams, cb: ICallback): void {
    const exchangeParams = _parseExchangeParams(exchange, this.type);
    if (exchangeParams instanceof Error) return cb(exchangeParams);

    const { keyExchanges } = redisKeys.getMainKeys();
    const { keyNamespaceExchanges } = redisKeys.getNamespaceKeys(
      exchangeParams.ns,
    );
    const { keyExchange, keyFanoutQueues } = redisKeys.getExchangeFanoutKeys(
      exchangeParams.ns,
      exchangeParams.name,
    );

    const exchangeStr = JSON.stringify(exchangeParams);

    withSharedPoolConnection((client, outerCb) => {
      withWatchTransaction(
        client,
        (c, watch, done) => {
          let boundQueuesCount = 0;

          async.waterfall(
            [
              // 1) WATCH base keys first so subsequent reads are protected
              (cb1: ICallback<void>) =>
                watch(
                  [
                    keyExchange,
                    keyFanoutQueues,
                    keyExchanges,
                    keyNamespaceExchanges,
                  ],
                  cb1,
                ),

              // 2) Validate exchange under WATCH
              (_: void, cb1: ICallback<void>) =>
                _validateExchange(c, exchangeParams, true, cb1),

              // 3) Ensure there are no bound queues (reads happen after WATCH)
              (_: void, cb1: ICallback<void>) =>
                c.sscanAll(keyFanoutQueues, {}, (err, queues) => {
                  if (err) return cb1(err);
                  boundQueuesCount = queues?.length ?? 0;
                  if (boundQueuesCount > 0) {
                    this.logger.warn(
                      `delete: exchange has ${boundQueuesCount} bound queues, aborting`,
                    );
                    return cb1(new ExchangeHasBoundQueuesError());
                  }
                  cb1();
                }),

              // 4) Build MULTI to delete atomically
              (_: void, cb1: ICallback<IWatchTransactionAttemptResult>) => {
                const multi = c.multi();

                // Remove exchange meta and fanout binding set
                multi.del(keyExchange);
                multi.del(keyFanoutQueues);

                // Remove from global and namespace indexes
                multi.srem(keyExchanges, exchangeStr);
                multi.srem(keyNamespaceExchanges, exchangeStr);

                cb1(null, { multi });
              },
            ],
            done,
          );
        },
        (err) => {
          if (err) return outerCb(err);
          this.logger.info(
            `delete: exchange "${exchangeParams.name}" (ns=${exchangeParams.ns}) deleted`,
          );
          outerCb();
        },
        {
          maxAttempts: 5,
          onRetry: (attemptNo, maxAttempts) =>
            this.logger.warn(
              `delete: concurrent modification, retrying attempt=${attemptNo}/${maxAttempts}`,
            ),
        },
      );
    }, cb);
  }

  /**
   * Binds a queue to a fanout exchange.
   *
   * This method creates a binding between a queue and a fanout exchange, enabling
   * messages published to the exchange to be delivered to the bound queue. In fanout
   * exchanges, all bound queues receive copies of every message, regardless of routing keys.
   *
   * @param queue - The queue to bind. Can be a string (queue name) or an object
   *               with name and namespace properties.
   * @param exchange - The exchange to bind to. Can be a string (exchange name) or
   *                  an object with name and namespace properties.
   * @param cb - Callback function called when the binding operation completes
   *
   * @throws {InvalidQueueParametersError} When queue parameters are invalid
   * @throws {InvalidExchangeParametersError} When exchange parameters are invalid
   * @throws {QueueNotFoundError} When the specified queue does not exist
   * @throws {NamespaceMismatchError} When namespace mismatch occurs
   * @throws {ExchangeError} When exchange type is invalid
   *                        or concurrent modifications are detected
   * @throws {Error} When Redis operations fail
   *
   * @example
   * ```typescript
   * const fanoutExchange = new ExchangeFanout();
   *
   * // Bind a queue to an exchange (both in default namespace)
   * fanoutExchange.bindQueue('email-notifications', 'user-events', (err) => {
   *   if (err) {
   *     if (err instanceof QueueNotFoundError) {
   *       console.error('Queue does not exist');
   *     } else if (err instanceof ExchangeError) {
   *       console.error('Exchange error:', err.message);
   *     } else {
   *       console.error('Binding failed:', err);
   *     }
   *     return;
   *   }
   *
   *   console.log('Queue bound to exchange successfully');
   * });
   *
   * // Bind with explicit namespace specification
   * fanoutExchange.bindQueue(
   *   { name: 'sms-notifications', ns: 'production' },
   *   { name: 'user-events', ns: 'production' },
   *   (err) => {
   *     if (!err) {
   *       console.log('Production queue bound successfully');
   *     }
   *   }
   * );
   *
   * // Multiple queues can be bound to the same fanout exchange
   * const queues = ['email-queue', 'sms-queue', 'push-queue'];
   * queues.forEach(queueName => {
   *   fanoutExchange.bindQueue(queueName, 'notification-fanout', (err) => {
   *     if (!err) console.log(`${queueName} bound to fanout exchange`);
   *   });
   * });
   * ```
   */
  bindQueue(
    queue: IQueueParams | string,
    exchange: string | IExchangeParams,
    cb: ICallback,
  ): void {
    const queueParams = _parseQueueParams(queue);
    const exchangeParams = _parseExchangeParams(exchange, this.type);

    if (queueParams instanceof Error) return cb(queueParams);
    if (exchangeParams instanceof Error) return cb(exchangeParams);

    if (queueParams.ns !== exchangeParams.ns) {
      return cb(new NamespaceMismatchError());
    }

    const { keyQueueProperties, keyQueueExchangeBindings } =
      redisKeys.getQueueKeys(queueParams.ns, queueParams.name, null);
    const { keyExchange, keyFanoutQueues } = redisKeys.getExchangeFanoutKeys(
      exchangeParams.ns,
      exchangeParams.name,
    );
    const { keyExchanges } = redisKeys.getMainKeys();
    const { keyNamespaceExchanges } = redisKeys.getNamespaceKeys(
      queueParams.ns,
    );

    const exchangeStr = JSON.stringify(exchangeParams);
    const queueStr = JSON.stringify(queueParams);

    withSharedPoolConnection((client, outerCb) => {
      withWatchTransaction(
        client,
        (c, watch, done) => {
          let exchangeQueuePolicy: EExchangeQueuePolicy;

          async.waterfall(
            [
              // 1) WATCH base keys BEFORE any reads that inform writes
              (cb1: ICallback<void>) =>
                watch(
                  [
                    keyExchange,
                    keyQueueProperties,
                    keyFanoutQueues,
                    keyQueueExchangeBindings,
                    keyExchanges,
                    keyNamespaceExchanges,
                  ],
                  cb1,
                ),

              // 2) Validate queue/exchange binding and compute exchange policy (under WATCH)
              (_: void, cb1: ICallback<void>) =>
                _validateQueueBinding(
                  c,
                  exchangeParams,
                  queueParams,
                  (err, reply) => {
                    if (err) return cb1(err);
                    if (!reply) return cb1(new CallbackEmptyReplyError());
                    const [queueProperties] = reply;
                    exchangeQueuePolicy =
                      queueProperties.queueType === EQueueType.PRIORITY_QUEUE
                        ? EExchangeQueuePolicy.PRIORITY
                        : EExchangeQueuePolicy.STANDARD;
                    cb1();
                  },
                ),

              // 3) Check if already bound (under WATCH)
              (_: void, cb1: ICallback<void>) =>
                c.sismember(keyFanoutQueues, queueStr, (err, reply) => {
                  if (err) return cb1(err);
                  if (reply === 1) {
                    this.logger.debug('bindQueue: already bound');
                    return cb1(new QueueAlreadyBound());
                  }
                  cb1();
                }),

              // 4) Build MULTI to persist meta, indexes, and the binding atomically
              (_: void, cb1: ICallback<IWatchTransactionAttemptResult>) => {
                const typeField = String(EExchangeProperty.TYPE);
                const queuePolicyField = String(EExchangeProperty.QUEUE_POLICY);

                const multi = c.multi();

                // Persist exchange meta as a hash
                multi.hset(keyExchange, typeField, EExchangeType.FANOUT);
                multi.hset(keyExchange, queuePolicyField, exchangeQueuePolicy);

                // Register exchange in global and namespace indexes
                multi.sadd(keyExchanges, exchangeStr);
                multi.sadd(keyNamespaceExchanges, exchangeStr);

                // Forward binding: add queue to the fanout set
                multi.sadd(keyFanoutQueues, queueStr);

                // Reverse index: record that this queue is bound to this exchange
                multi.sadd(keyQueueExchangeBindings, exchangeStr);

                cb1(null, { multi });
              },
            ],
            done,
          );
        },
        (err) => {
          if (err) {
            // Treat already-bound as success (idempotent)
            if (err instanceof QueueAlreadyBound) return outerCb();
            return outerCb(err);
          }
          this.logger.info(
            `bindQueue: bound q=${queueParams.name} ns=${queueParams.ns} -> ex=${exchangeParams.name} ns=${exchangeParams.ns}`,
          );
          outerCb();
        },
        {
          maxAttempts: 5,
          onRetry: (attemptNo, maxAttempts) =>
            this.logger.warn(
              `bindQueue: concurrent modification, retrying attempt=${attemptNo}/${maxAttempts}`,
            ),
        },
      );
    }, cb);
  }

  /**
   * Unbinds a queue from a fanout exchange.
   *
   * This method removes the binding between a queue and a fanout exchange, stopping
   * message delivery from the exchange to the specified queue. Other queues bound
   * to the same exchange will continue to receive messages.
   *
   * Note: This operation does not delete the exchange or queue, only removes their binding.
   *
   * @param queue - The queue to unbind. Can be a string (queue name) or an object
   *               with name and namespace properties.
   * @param exchange - The exchange to unbind from. Can be a string (exchange name) or
   *                  an object with name and namespace properties.
   * @param cb - Callback function called when the unbinding operation completes
   *
   * @throws {InvalidQueueParametersError} When queue parameters are invalid
   * @throws {InvalidExchangeParametersError} When exchange parameters are invalid
   * @throws {NamespaceMismatchError} When namespace mismatch occurs
   * @throws {ExchangeError} When exchange type is invalid,
   *                        exchange is not found or concurrent modifications are detected
   * @throws {Error} When Redis operations fail
   *
   * @example
   * ```typescript
   * const fanoutExchange = new ExchangeFanout();
   *
   * // Unbind a queue from an exchange
   * fanoutExchange.unbindQueue('email-notifications', 'user-events', (err) => {
   *   if (err) {
   *     if (err instanceof ExchangeError) {
   *       console.error('Exchange error:', err.message);
   *     } else {
   *       console.error('Unbinding failed:', err);
   *     }
   *     return;
   *   }
   *
   *   console.log('Queue unbound from exchange successfully');
   * });
   *
   * // Unbind with explicit namespace specification
   * fanoutExchange.unbindQueue(
   *   { name: 'sms-notifications', ns: 'production' },
   *   { name: 'user-events', ns: 'production' },
   *   (err) => {
   *     if (!err) {
   *       console.log('Production queue unbound successfully');
   *     }
   *   }
   * );
   *
   * // Unbind multiple queues from the same exchange
   * const queuesToUnbind = ['temp-queue-1', 'temp-queue-2'];
   * queuesToUnbind.forEach(queueName => {
   *   fanoutExchange.unbindQueue(queueName, 'broadcast-exchange', (err) => {
   *     if (!err) console.log(`${queueName} unbound from exchange`);
   *   });
   * });
   * ```
   */
  unbindQueue(
    queue: IQueueParams | string,
    exchange: string | IExchangeParams,
    cb: ICallback,
  ): void {
    const queueParams = _parseQueueParams(queue);
    const exchangeParams = _parseExchangeParams(exchange, this.type);

    if (queueParams instanceof Error) return cb(queueParams);
    if (exchangeParams instanceof Error) return cb(exchangeParams);

    if (queueParams.ns !== exchangeParams.ns) {
      this.logger.error(`Namespace mismatch`);
      return cb(new NamespaceMismatchError());
    }

    const { keyQueueProperties, keyQueueExchangeBindings } =
      redisKeys.getQueueKeys(queueParams.ns, queueParams.name, null);
    const { keyExchange, keyFanoutQueues } = redisKeys.getExchangeFanoutKeys(
      exchangeParams.ns,
      exchangeParams.name,
    );

    const queueStr = JSON.stringify(queueParams);
    const exchangeStr = JSON.stringify(exchangeParams);

    withSharedPoolConnection((client, outerCb) => {
      withWatchTransaction(
        client,
        (c, watch, done) => {
          async.waterfall(
            [
              // 1) WATCH base keys BEFORE reads
              (cb1: ICallback<void>) =>
                watch(
                  [
                    keyExchange,
                    keyQueueProperties,
                    keyFanoutQueues,
                    keyQueueExchangeBindings,
                  ],
                  cb1,
                ),

              // 2) Validate exchange type (under WATCH)
              (_: void, cb1: ICallback<void>) =>
                _validateExchange(c, exchangeParams, true, cb1),

              // 3) Ensure the queue is currently bound (under WATCH)
              (_: void, cb1: ICallback<void>) =>
                c.sismember(keyFanoutQueues, queueStr, (err, reply) => {
                  if (err) return cb1(err);
                  if (reply !== 1) return cb1(new QueueNotBoundError());
                  cb1();
                }),

              // 4) Build MULTI to unbind atomically
              (_: void, cb1: ICallback<IWatchTransactionAttemptResult>) => {
                const multi = c.multi();

                // Remove queue from fanout set
                multi.srem(keyFanoutQueues, queueStr);

                // Reverse index: remove exchange from queue's bindings
                multi.srem(keyQueueExchangeBindings, exchangeStr);

                cb1(null, { multi });
              },
            ],
            done,
          );
        },
        (err) => {
          if (err) return outerCb(err);
          this.logger.info(
            `unbindQueue: unbound q=${queueParams.name} ns=${queueParams.ns} <- ex=${exchangeParams.name} ns=${exchangeParams.ns}`,
          );
          outerCb();
        },
        {
          maxAttempts: 5,
          onRetry: (attemptNo, maxAttempts) =>
            this.logger.warn(
              `unbindQueue: concurrent modification, retrying attempt=${attemptNo}/${maxAttempts}`,
            ),
        },
      );
    }, cb);
  }
}
