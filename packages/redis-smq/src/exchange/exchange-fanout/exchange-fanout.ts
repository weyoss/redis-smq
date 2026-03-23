/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
import { _getBoundQueues } from './_/_get-bound-queues.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { EQueueOperation } from '../../queue-operation-validator/index.js';

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
 * // Callback pattern
 * fanoutExchange.bindQueue('notifications', 'broadcast-exchange', (err) => {
 *   if (err) console.error('Failed to bind:', err);
 *   else console.log('Queue bound');
 * });
 *
 * // Promise pattern
 * await fanoutExchange.bindQueue('notifications', 'broadcast-exchange');
 * console.log('Queue bound');
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
   * of routing keys.
   *
   * @param exchange - The exchange identifier (string name or object with ns/name)
   * @param cb - Optional callback invoked with the list of bound queues
   * @returns {Promise<IQueueParams[]> | void} - Returns a Promise if no callback is provided
   *
   * @throws InvalidExchangeParametersError
   *
   * @example
   * ```typescript
   * // Callback pattern
   * fanoutExchange.matchQueues('broadcast-exchange', (err, queues) => {
   *   if (err) {
   *     console.error('Failed to get bound queues:', err);
   *   } else {
   *     console.log(`Found ${queues.length} bound queues`);
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const queues = await fanoutExchange.matchQueues('broadcast-exchange');
   *   console.log(`Found ${queues.length} bound queues`);
   * } catch (err) {
   *   console.error('Failed to get bound queues:', err);
   * }
   * ```
   */
  matchQueues(exchange: string | IExchangeParams): Promise<IQueueParams[]>;
  matchQueues(
    exchange: string | IExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;
  matchQueues(
    exchange: string | IExchangeParams,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.getBindings(exchange, callback);
    });
  }

  /**
   * Creates a fanout exchange.
   *
   * @param exchange - The exchange identifier (string name or object with ns/name)
   * @param queuePolicy - The queue policy for this exchange (STANDARD or PRIORITY)
   * @param cb - Optional callback invoked when creation completes
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * fanoutExchange.create('broadcast-exchange', EExchangeQueuePolicy.STANDARD, (err) => {
   *   if (err) console.error('Failed to create exchange:', err);
   *   else console.log('Exchange created');
   * });
   *
   * // Promise pattern
   * try {
   *   await fanoutExchange.create('broadcast-exchange', EExchangeQueuePolicy.STANDARD);
   *   console.log('Exchange created');
   * } catch (err) {
   *   console.error('Failed to create exchange:', err);
   * }
   * ```
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
  create(
    exchange: string | IExchangeParams,
    queuePolicy: EExchangeQueuePolicy,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const exchangeParams = _parseExchangeParams(exchange, this.type);
      if (exchangeParams instanceof Error)
        return callback(new InvalidFanoutExchangeParametersError());
      withSharedPoolConnection(
        (client, cb) => _saveExchange(client, exchangeParams, queuePolicy, cb),
        callback,
      );
    });
  }

  /**
   * Deletes a fanout exchange from the system.
   *
   * @param exchange - The exchange identifier (string name or object with ns/name)
   * @param cb - Optional callback invoked when deletion completes
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @throws InvalidExchangeParametersError
   * @throws ExchangeHasBoundQueuesError
   * @throws ExchangeNotFoundError
   *
   * @example
   * ```typescript
   * // Callback pattern
   * fanoutExchange.delete('old-broadcast-exchange', (err) => {
   *   if (err) {
   *     console.error('Failed to delete exchange:', err);
   *   } else {
   *     console.log('Exchange deleted successfully');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await fanoutExchange.delete('old-broadcast-exchange');
   *   console.log('Exchange deleted successfully');
   * } catch (err) {
   *   console.error('Failed to delete exchange:', err);
   * }
   * ```
   */
  delete(exchange: string | IExchangeParams): Promise<void>;
  delete(exchange: string | IExchangeParams, cb: ICallback): void;
  delete(
    exchange: string | IExchangeParams,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const exchangeParams = _parseExchangeParams(exchange, this.type);
      if (exchangeParams instanceof Error) return callback(exchangeParams);

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

                (_: void, cb1: ICallback<void>) =>
                  _validateExchange(c, exchangeParams, true, cb1),

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

                (_: void, cb1: ICallback<IWatchTransactionAttemptResult>) => {
                  const multi = c.multi();
                  multi.del(keyExchange);
                  multi.del(keyFanoutQueues);
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
              `delete: deleted exchange ${exchangeParams.name}@${exchangeParams.ns}`,
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
      }, callback);
    });
  }

  /**
   * Binds a queue to a fanout exchange.
   *
   * This method creates a binding between a queue and a fanout exchange, enabling
   * messages published to the exchange to be delivered to the bound queue.
   *
   * @param queue - The queue to bind (string name or object with ns/name)
   * @param exchange - The exchange to bind to (string name or object with ns/name)
   * @param cb - Optional callback invoked when binding completes
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @throws InvalidQueueParametersError
   * @throws InvalidExchangeParametersError
   * @throws QueueNotFoundError
   * @throws ExchangeNotFoundError
   * @throws NamespaceMismatchError
   *
   * @example
   * ```typescript
   * // Callback pattern
   * fanoutExchange.bindQueue('email-notifications', 'user-events', (err) => {
   *   if (err) {
   *     console.error('Failed to bind:', err);
   *   } else {
   *     console.log('Queue bound successfully');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await fanoutExchange.bindQueue('email-notifications', 'user-events');
   *   console.log('Queue bound successfully');
   * } catch (err) {
   *   console.error('Failed to bind:', err);
   * }
   * ```
   */
  bindQueue(
    queue: IQueueParams | string,
    exchange: string | IExchangeParams,
  ): Promise<void>;
  bindQueue(
    queue: IQueueParams | string,
    exchange: string | IExchangeParams,
    cb: ICallback,
  ): void;
  bindQueue(
    queue: IQueueParams | string,
    exchange: string | IExchangeParams,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueParams = _parseQueueParams(queue);
      const exchangeParams = _parseExchangeParams(exchange, this.type);

      if (queueParams instanceof Error) return callback(queueParams);
      if (exchangeParams instanceof Error) return callback(exchangeParams);

      if (queueParams.ns !== exchangeParams.ns) {
        return callback(new NamespaceMismatchError());
      }

      this.logger.info(
        `bindQueue: bind queue=${queueParams.name}@${queueParams.ns} -> ex=${exchangeParams.name}@${exchangeParams.ns}`,
      );

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
        async.series(
          [
            (cb) =>
              _validateOperation(
                client,
                queueParams,
                EQueueOperation.BIND_EXCHANGE,
                cb,
              ),
            (cb) =>
              withWatchTransaction(
                client,
                (c, watch, done) => {
                  let exchangeQueuePolicy: EExchangeQueuePolicy;

                  async.waterfall(
                    [
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

                      (_: void, cb1: ICallback<void>) =>
                        _validateQueueBinding(
                          c,
                          exchangeParams,
                          queueParams,
                          (err, reply) => {
                            if (err) return cb1(err);
                            if (!reply)
                              return cb1(new CallbackEmptyReplyError());
                            const [queueProperties] = reply;
                            exchangeQueuePolicy =
                              queueProperties.queueType ===
                              EQueueType.PRIORITY_QUEUE
                                ? EExchangeQueuePolicy.PRIORITY
                                : EExchangeQueuePolicy.STANDARD;
                            cb1();
                          },
                        ),

                      (_: void, cb1: ICallback<void>) =>
                        c.sismember(keyFanoutQueues, queueStr, (err, reply) => {
                          if (err) return cb1(err);
                          if (reply === 1) {
                            this.logger.debug('bindQueue: already bound');
                            return cb1(new QueueAlreadyBound());
                          }
                          cb1();
                        }),

                      (
                        _: void,
                        cb1: ICallback<IWatchTransactionAttemptResult>,
                      ) => {
                        const typeField = String(EExchangeProperty.TYPE);
                        const queuePolicyField = String(
                          EExchangeProperty.QUEUE_POLICY,
                        );

                        const multi = c.multi();
                        multi.hset(
                          keyExchange,
                          typeField,
                          EExchangeType.FANOUT,
                        );
                        multi.hset(
                          keyExchange,
                          queuePolicyField,
                          exchangeQueuePolicy,
                        );
                        multi.sadd(keyExchanges, exchangeStr);
                        multi.sadd(keyNamespaceExchanges, exchangeStr);
                        multi.sadd(keyFanoutQueues, queueStr);
                        multi.sadd(keyQueueExchangeBindings, exchangeStr);

                        cb1(null, { multi });
                      },
                    ],
                    done,
                  );
                },
                (err) => {
                  if (err) {
                    if (err instanceof QueueAlreadyBound) return cb();
                    return cb(err);
                  }
                  this.logger.info(
                    `bindQueue: bound queue=${queueParams.name}@${queueParams.ns} -> ex=${exchangeParams.name}@${exchangeParams.ns}`,
                  );
                  cb();
                },
                {
                  maxAttempts: 5,
                  onRetry: (attemptNo, maxAttempts) =>
                    this.logger.warn(
                      `bindQueue: concurrent modification, retrying attempt=${attemptNo}/${maxAttempts}`,
                    ),
                },
              ),
          ],
          (err) => outerCb(err),
        );
      }, callback);
    });
  }

  /**
   * Unbinds a queue from a fanout exchange.
   *
   * This method removes the binding between a queue and a fanout exchange, stopping
   * message delivery from the exchange to the specified queue.
   *
   * @param queue - The queue to unbind (string name or object with ns/name)
   * @param exchange - The exchange to unbind from (string name or object with ns/name)
   * @param cb - Optional callback invoked when unbinding completes
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @throws InvalidQueueParametersError
   * @throws InvalidExchangeParametersError
   * @throws NamespaceMismatchError
   * @throws QueueNotBoundError
   *
   * @example
   * ```typescript
   * // Callback pattern
   * fanoutExchange.unbindQueue('email-notifications', 'user-events', (err) => {
   *   if (err) {
   *     console.error('Failed to unbind:', err);
   *   } else {
   *     console.log('Queue unbound successfully');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await fanoutExchange.unbindQueue('email-notifications', 'user-events');
   *   console.log('Queue unbound successfully');
   * } catch (err) {
   *   console.error('Failed to unbind:', err);
   * }
   * ```
   */
  unbindQueue(
    queue: IQueueParams | string,
    exchange: string | IExchangeParams,
  ): Promise<void>;
  unbindQueue(
    queue: IQueueParams | string,
    exchange: string | IExchangeParams,
    cb: ICallback,
  ): void;
  unbindQueue(
    queue: IQueueParams | string,
    exchange: string | IExchangeParams,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueParams = _parseQueueParams(queue);
      const exchangeParams = _parseExchangeParams(exchange, this.type);

      if (queueParams instanceof Error) return callback(queueParams);
      if (exchangeParams instanceof Error) return callback(exchangeParams);

      if (queueParams.ns !== exchangeParams.ns) {
        this.logger.error(`Namespace mismatch`);
        return callback(new NamespaceMismatchError());
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
        async.series(
          [
            (cb) =>
              _validateOperation(
                client,
                queueParams,
                EQueueOperation.UNBIND_EXCHANGE,
                cb,
              ),
            (cb) =>
              withWatchTransaction(
                client,
                (c, watch, done) => {
                  async.waterfall(
                    [
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

                      (_: void, cb1: ICallback<void>) =>
                        _validateExchange(c, exchangeParams, true, cb1),

                      (_: void, cb1: ICallback<void>) =>
                        c.sismember(keyFanoutQueues, queueStr, (err, reply) => {
                          if (err) return cb1(err);
                          if (reply !== 1) return cb1(new QueueNotBoundError());
                          cb1();
                        }),

                      (
                        _: void,
                        cb1: ICallback<IWatchTransactionAttemptResult>,
                      ) => {
                        const multi = c.multi();
                        multi.srem(keyFanoutQueues, queueStr);
                        multi.srem(keyQueueExchangeBindings, exchangeStr);
                        cb1(null, { multi });
                      },
                    ],
                    done,
                  );
                },
                (err) => {
                  if (err) return cb(err);
                  this.logger.info(
                    `unbindQueue: unbound queue=${queueParams.name}@${queueParams.ns} from ex=${exchangeParams.name}@${exchangeParams.ns}`,
                  );
                  cb();
                },
                {
                  maxAttempts: 5,
                  onRetry: (attemptNo, maxAttempts) =>
                    this.logger.warn(
                      `unbindQueue: concurrent modification, retrying attempt=${attemptNo}/${maxAttempts}`,
                    ),
                },
              ),
          ],
          (err) => outerCb(err),
        );
      }, callback);
    });
  }

  /**
   * Retrieves all bound queues for a fanout exchange.
   *
   * This method returns the complete list of queues bound to the fanout exchange.
   *
   * @param exchange - The exchange identifier (string name or object with ns/name)
   * @param cb - Optional callback invoked with the list of bound queues
   * @returns {Promise<IQueueParams[]> | void} - Returns a Promise if no callback is provided
   *
   * @throws InvalidExchangeParametersError
   *
   * @example
   * ```typescript
   * // Callback pattern
   * fanoutExchange.getBindings('broadcast-exchange', (err, queues) => {
   *   if (err) {
   *     console.error('Failed to get bindings:', err);
   *   } else {
   *     console.log(`Found ${queues.length} bound queues`);
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const queues = await fanoutExchange.getBindings('broadcast-exchange');
   *   console.log(`Found ${queues.length} bound queues`);
   * } catch (err) {
   *   console.error('Failed to get bindings:', err);
   * }
   * ```
   */
  getBindings(exchange: string | IExchangeParams): Promise<IQueueParams[]>;
  getBindings(
    exchange: string | IExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;
  getBindings(
    exchange: string | IExchangeParams,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const exchangeParams = _parseExchangeParams(exchange, this.type);
      if (exchangeParams instanceof Error) return callback(exchangeParams);
      withSharedPoolConnection(
        (client, cb) => _getBoundQueues(client, exchangeParams, cb),
        callback,
      );
    });
  }
}
