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
  InvalidExchangeRoutingKeyError,
  InvalidDirectExchangeParametersError,
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
import { _getRoutingKeyBoundQueues } from './_/_get-routing-key-bound-queues.js';
import { _getRoutingKeys } from './_/_get-routing-keys.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { EQueueOperation } from '../../queue-operation-validator/index.js';
import { validateRedisKey } from '../../common/redis/redis-keys/validator.js';

/**
 * Direct Exchange implementation for RedisSMQ.
 *
 * A direct exchange routes messages to queues based on exact routing key matches.
 * Messages published with a specific routing key are delivered only to queues
 * bound to that exact routing key. This provides precise message routing control
 * and is ideal for point-to-point messaging patterns.
 *
 * Key Features:
 * - Exact routing key matching for precise message delivery
 * - Multiple queues can be bound to the same routing key
 * - Atomic binding and unbinding operations with Redis transactions
 * - Concurrent modification detection using Redis WATCH
 * - Namespace isolation for multi-tenant applications
 * - Automatic cleanup of empty routing keys and reverse indexes
 * - Comprehensive validation and error handling
 *
 * @example
 * ```typescript
 * const directExchange = new ExchangeDirect();
 *
 * // Callback pattern
 * directExchange.bindQueue('order-processor', 'order-events', 'order.created', (err) => {
 *   if (err) console.error('Failed to bind:', err);
 *   else console.log('Queue bound');
 * });
 *
 * // Promise pattern
 * await directExchange.bindQueue('order-processor', 'order-events', 'order.created');
 * console.log('Queue bound');
 * ```
 */
export class ExchangeDirect {
  protected readonly type = EExchangeType.DIRECT;
  protected readonly logger: ReturnType<typeof createLogger>;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name,
    );
    this.logger.debug('ExchangeDirect initialized');
  }

  /**
   * Retrieve all routing keys currently bound to a direct exchange.
   *
   * @param exchange - Exchange identifier (string name or object with ns/name)
   * @param cb - Optional callback invoked with the list of routing keys
   * @returns {Promise<string[]> | void} - Returns a Promise if no callback is provided
   *
   * @throws InvalidExchangeParametersError
   *
   * @example
   * ```typescript
   * // Callback pattern
   * directExchange.getRoutingKeys('order-events', (err, keys) => {
   *   if (err) {
   *     console.error('Failed to get routing keys:', err);
   *   } else {
   *     console.log('Routing keys:', keys);
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const keys = await directExchange.getRoutingKeys('order-events');
   *   console.log('Routing keys:', keys);
   * } catch (err) {
   *   console.error('Failed to get routing keys:', err);
   * }
   * ```
   */
  getRoutingKeys(exchange: string | IExchangeParams): Promise<string[]>;
  getRoutingKeys(
    exchange: string | IExchangeParams,
    cb: ICallback<string[]>,
  ): void;
  getRoutingKeys(
    exchange: string | IExchangeParams,
    cb?: ICallback<string[]>,
  ): Promise<string[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const exchangeParams = _parseExchangeParams(
        exchange,
        EExchangeType.DIRECT,
      );
      if (exchangeParams instanceof Error) return callback(exchangeParams);
      withSharedPoolConnection(
        (client, done) => _getRoutingKeys(client, exchangeParams, done),
        callback,
      );
    });
  }

  /**
   * Retrieves all queues bound to a specific routing key for a direct exchange.
   *
   * @param exchange - Exchange identifier (string name or object with ns/name)
   * @param routingKey - Routing key to resolve
   * @param cb - Optional callback invoked with the list of bound queues
   * @returns {Promise<IQueueParams[]> | void} - Returns a Promise if no callback is provided
   *
   * @throws InvalidExchangeParametersError
   * @throws InvalidDirectExchangeParametersError
   *
   * @example
   * ```typescript
   * // Callback pattern
   * directExchange.getRoutingKeyBoundQueues('order-events', 'order.created', (err, queues) => {
   *   if (err) {
   *     console.error('Failed to get bound queues:', err);
   *   } else {
   *     console.log('Bound queues:', queues);
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const queues = await directExchange.getRoutingKeyBoundQueues('order-events', 'order.created');
   *   console.log('Bound queues:', queues);
   * } catch (err) {
   *   console.error('Failed to get bound queues:', err);
   * }
   * ```
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
  getRoutingKeyBoundQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const exchangeParams = _parseExchangeParams(
        exchange,
        EExchangeType.DIRECT,
      );
      if (exchangeParams instanceof Error) return callback(exchangeParams);

      const validatedRoutingKey = validateRedisKey(routingKey);
      if (validatedRoutingKey instanceof Error)
        return callback(new InvalidDirectExchangeParametersError());

      withSharedPoolConnection((client, done) => {
        _getRoutingKeyBoundQueues(
          client,
          exchangeParams,
          validatedRoutingKey,
          done,
        );
      }, callback);
    });
  }

  /**
   * Retrieves all queues bound to the specified routing key in a direct exchange.
   *
   * This method performs an exact match lookup for the given routing key and returns
   * all queues that are bound to it. In direct exchanges, only queues with exact
   * routing key matches will receive messages.
   *
   * @param exchange - The exchange identifier (string name or object with ns/name)
   * @param routingKey - The routing key to match against
   * @param cb - Optional callback invoked with the list of matching queues
   * @returns {Promise<IQueueParams[]> | void} - Returns a Promise if no callback is provided
   *
   * @throws InvalidExchangeParametersError
   * @throws InvalidExchangeRoutingKeyError
   * @throws ExchangeNotFoundError
   * @throws ExchangeTypeMismatchError
   *
   * @example
   * ```typescript
   * // Callback pattern
   * directExchange.matchQueues('order-events', 'order.created', (err, queues) => {
   *   if (err) {
   *     console.error('Failed to match queues:', err);
   *   } else {
   *     console.log(`Found ${queues.length} queues`);
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const queues = await directExchange.matchQueues('order-events', 'order.created');
   *   console.log(`Found ${queues.length} queues`);
   * } catch (err) {
   *   console.error('Failed to match queues:', err);
   * }
   * ```
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
  matchQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const exchangeParams = _parseExchangeParams(exchange, this.type);
      if (exchangeParams instanceof Error) {
        this.logger.error('matchQueues: invalid exchange params');
        return callback(exchangeParams);
      }

      const validatedRoutingKey = validateRedisKey(routingKey);
      if (validatedRoutingKey instanceof Error) {
        this.logger.error(`matchQueues: invalid routing key "${routingKey}"`);
        return callback(
          new InvalidExchangeRoutingKeyError({
            metadata: {
              exchange: exchangeParams,
              routingKey: routingKey,
            },
          }),
        );
      }

      this.logger.debug(
        `matchQueues: resolving queues ns=${exchangeParams.ns} ex=${exchangeParams.name} rk=${validatedRoutingKey}`,
      );

      withSharedPoolConnection((client, done) => {
        const result: IQueueParams[] = [];
        async.series(
          [
            (cb1: ICallback) =>
              _validateExchange(client, exchangeParams, true, cb1),
            (cb1: ICallback) =>
              _getRoutingKeyBoundQueues(
                client,
                exchangeParams,
                validatedRoutingKey,
                (err, reply) => {
                  if (err) return cb1(err);
                  if (reply && reply.length) result.push(...reply);
                  cb1();
                },
              ),
          ],
          (err) => {
            if (err) return done(err);
            this.logger.debug(
              `matchQueues: matched ${result.length} queue(s) ns=${exchangeParams.ns} ex=${exchangeParams.name} rk=${validatedRoutingKey}`,
            );
            done(null, result);
          },
        );
      }, callback);
    });
  }

  /**
   * Creates a direct exchange.
   *
   * @param exchange - The exchange identifier (string name or object with ns/name)
   * @param queuePolicy - The queue policy for this exchange (STANDARD or PRIORITY)
   * @param cb - Optional callback invoked when creation completes
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * directExchange.create('order-events', EExchangeQueuePolicy.STANDARD, (err) => {
   *   if (err) console.error('Failed to create exchange:', err);
   *   else console.log('Exchange created');
   * });
   *
   * // Promise pattern
   * try {
   *   await directExchange.create('order-events', EExchangeQueuePolicy.STANDARD);
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
        return callback(new InvalidDirectExchangeParametersError());
      withSharedPoolConnection(
        (client, cb) => _saveExchange(client, exchangeParams, queuePolicy, cb),
        callback,
      );
    });
  }

  /**
   * Binds a queue to a direct exchange with a specific routing key.
   *
   * This method creates a binding between a queue and a direct exchange for a specific
   * routing key. Messages published to the exchange with this routing key will be
   * delivered to the bound queue.
   *
   * @param queue - The queue to bind (string name or object with ns/name)
   * @param exchange - The exchange to bind to (string name or object with ns/name)
   * @param routingKey - The routing key for message routing
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
   * directExchange.bindQueue('order-processor', 'order-events', 'order.created', (err) => {
   *   if (err) {
   *     console.error('Failed to bind:', err);
   *   } else {
   *     console.log('Queue bound successfully');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await directExchange.bindQueue('order-processor', 'order-events', 'order.created');
   *   console.log('Queue bound successfully');
   * } catch (err) {
   *   console.error('Failed to bind:', err);
   * }
   * ```
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
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueParams = _parseQueueParams(queue);
      const exchangeParams = _parseExchangeParams(exchange, this.type);
      if (queueParams instanceof Error) {
        this.logger.error('bindQueue: invalid queue params');
        return callback(queueParams);
      }
      if (exchangeParams instanceof Error) {
        this.logger.error('bindQueue: invalid exchange params');
        return callback(exchangeParams);
      }

      if (queueParams.ns !== exchangeParams.ns) {
        this.logger.error(
          `bindQueue: namespace mismatch q.ns=${queueParams.ns} ex.ns=${exchangeParams.ns}`,
        );
        return callback(new NamespaceMismatchError());
      }

      const validatedRoutingKey = validateRedisKey(routingKey);
      if (validatedRoutingKey instanceof Error) {
        this.logger.error(`bindQueue: invalid routing key "${routingKey}"`);
        return callback(new InvalidDirectExchangeParametersError());
      }

      const { keyQueueProperties, keyQueueExchangeBindings } =
        redisKeys.getQueueKeys(queueParams.ns, queueParams.name, null);
      const { keyExchange } = redisKeys.getExchangeKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );
      const { keyExchangeRoutingKeys } = redisKeys.getExchangeDirectKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );
      const { keyRoutingKeyQueues } = redisKeys.getExchangeDirectRoutingKeyKeys(
        exchangeParams.ns,
        exchangeParams.name,
        validatedRoutingKey,
      );
      const { keyExchanges } = redisKeys.getMainKeys();
      const { keyNamespaceExchanges } = redisKeys.getNamespaceKeys(
        queueParams.ns,
      );

      const queueStr = JSON.stringify(queueParams);
      const exchangeStr = JSON.stringify(exchangeParams);

      this.logger.debug(
        `bindQueue: bind q=${queueParams.name} ns=${queueParams.ns} -> ex=${exchangeParams.name} ns=${exchangeParams.ns} rk=${validatedRoutingKey}`,
      );

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
                (client, watch, done) => {
                  let exchangeQueuePolicy: EExchangeQueuePolicy | null = null;

                  async.waterfall(
                    [
                      (cb1: ICallback<void>) =>
                        watch(
                          [
                            keyExchange,
                            keyQueueProperties,
                            keyExchangeRoutingKeys,
                            keyRoutingKeyQueues,
                            keyQueueExchangeBindings,
                            keyExchanges,
                            keyNamespaceExchanges,
                          ],
                          cb1,
                        ),

                      (_: void, cb1: ICallback<void>) =>
                        _validateQueueBinding(
                          client,
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
                        client.sismember(
                          keyRoutingKeyQueues,
                          queueStr,
                          (err, reply) => {
                            if (err) return cb1(err);
                            const already = reply === 1;
                            if (already) {
                              this.logger.debug('bindQueue: already bound');
                              return cb1(new QueueAlreadyBound());
                            }
                            cb1();
                          },
                        ),

                      (
                        _: void,
                        cb1: ICallback<IWatchTransactionAttemptResult>,
                      ) => {
                        const typeField = String(EExchangeProperty.TYPE);
                        const queuePolicyField = String(
                          EExchangeProperty.QUEUE_POLICY,
                        );

                        const multi = client.multi();

                        multi.hset(
                          keyExchange,
                          typeField,
                          EExchangeType.DIRECT,
                        );
                        multi.hset(
                          keyExchange,
                          queuePolicyField,
                          Number(exchangeQueuePolicy),
                        );

                        multi.sadd(keyExchanges, exchangeStr);
                        multi.sadd(keyNamespaceExchanges, exchangeStr);
                        multi.sadd(keyExchangeRoutingKeys, validatedRoutingKey);
                        multi.sadd(keyRoutingKeyQueues, queueStr);
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
                    `bindQueue: bound queue=${queueParams.name}@${queueParams.ns} -> ex=${exchangeParams.name}@${exchangeParams.ns} rk=${validatedRoutingKey}`,
                  );
                  cb();
                },
              ),
          ],
          (err) => outerCb(err),
        );
      }, callback);
    });
  }

  /**
   * Unbinds a queue from a direct exchange for a specific routing key.
   *
   * This method removes the binding between a queue and a direct exchange for the
   * specified routing key. After unbinding, messages with this routing key will no
   * longer be delivered to the unbound queue.
   *
   * @param queue - The queue to unbind (string name or object with ns/name)
   * @param exchange - The exchange to unbind from (string name or object with ns/name)
   * @param routingKey - The routing key to unbind from
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
   * directExchange.unbindQueue('order-processor', 'order-events', 'order.created', (err) => {
   *   if (err) {
   *     console.error('Failed to unbind:', err);
   *   } else {
   *     console.log('Queue unbound successfully');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await directExchange.unbindQueue('order-processor', 'order-events', 'order.created');
   *   console.log('Queue unbound successfully');
   * } catch (err) {
   *   console.error('Failed to unbind:', err);
   * }
   * ```
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
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
    cb?: ICallback,
  ): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueParams = _parseQueueParams(queue);
      const exchangeParams = _parseExchangeParams(exchange, this.type);
      if (queueParams instanceof Error) {
        this.logger.error('unbindQueue: invalid queue params');
        return callback(queueParams);
      }
      if (exchangeParams instanceof Error) {
        this.logger.error('unbindQueue: invalid exchange params');
        return callback(exchangeParams);
      }

      if (queueParams.ns !== exchangeParams.ns) {
        this.logger.error('unbindQueue: namespace mismatch');
        return callback(new NamespaceMismatchError());
      }

      const validatedRoutingKey = validateRedisKey(routingKey);
      if (validatedRoutingKey instanceof Error) {
        this.logger.error(`unbindQueue: invalid routing key "${routingKey}"`);
        return callback(new InvalidDirectExchangeParametersError());
      }

      const { keyQueueExchangeBindings } = redisKeys.getQueueKeys(
        queueParams.ns,
        queueParams.name,
        null,
      );
      const { keyExchange } = redisKeys.getExchangeKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );
      const { keyExchangeRoutingKeys } = redisKeys.getExchangeDirectKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );
      const { keyRoutingKeyQueues } = redisKeys.getExchangeDirectRoutingKeyKeys(
        exchangeParams.ns,
        exchangeParams.name,
        validatedRoutingKey,
      );

      const queueStr = JSON.stringify(queueParams);
      const exchangeStr = JSON.stringify(exchangeParams);

      this.logger.debug(
        `unbindQueue: unbinding q=${queueParams.name} ns=${queueParams.ns} from ex=${exchangeParams.name} ns=${exchangeParams.ns} rk=${validatedRoutingKey}`,
      );

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
                (client, watch, done) => {
                  let routingKeysAll: string[] = [];
                  let otherRoutingKeySets: string[] = [];
                  let currentCount = 0;
                  let stillBoundViaOtherRK = false;

                  async.waterfall(
                    [
                      (cb1: ICallback<void>) => {
                        const baseWatchKeys = [
                          keyExchange,
                          keyExchangeRoutingKeys,
                          keyRoutingKeyQueues,
                          keyQueueExchangeBindings,
                        ];
                        watch(baseWatchKeys, cb1);
                      },

                      (_: void, cb1: ICallback<void>) =>
                        _validateExchange(client, exchangeParams, true, cb1),

                      (_: void, cb1: ICallback<void>) => {
                        client.sismember(
                          keyRoutingKeyQueues,
                          queueStr,
                          (err, reply) => {
                            if (err) return cb1(err);
                            if (reply !== 1) {
                              this.logger.warn('unbindQueue: queue not bound');
                              return cb1(new QueueNotBoundError());
                            }
                            cb1();
                          },
                        );
                      },

                      (_: void, cb1: ICallback<void>) => {
                        client.smembers(keyExchangeRoutingKeys, (err, keys) => {
                          if (err) return cb1(err);
                          routingKeysAll = keys ?? [];
                          cb1();
                        });
                      },

                      (_: void, cb1: ICallback<void>) => {
                        const others = routingKeysAll.filter(
                          (rk) => rk !== validatedRoutingKey,
                        );
                        otherRoutingKeySets = others.map((rk) => {
                          const { keyRoutingKeyQueues: k } =
                            redisKeys.getExchangeDirectRoutingKeyKeys(
                              exchangeParams.ns,
                              exchangeParams.name,
                              rk,
                            );
                          return k;
                        });

                        if (otherRoutingKeySets.length === 0) return cb1();
                        watch(otherRoutingKeySets, cb1);
                      },

                      (_: void, cb1: ICallback<void>) => {
                        async.series(
                          [
                            (cbx: ICallback<void>) =>
                              client.scard(
                                keyRoutingKeyQueues,
                                (err, count) => {
                                  if (err) return cbx(err);
                                  currentCount = count || 0;
                                  cbx();
                                },
                              ),
                            (cbx: ICallback<void>) => {
                              if (otherRoutingKeySets.length === 0)
                                return cbx();
                              async.eachOf(
                                otherRoutingKeySets,
                                (k, _i, next) => {
                                  if (stillBoundViaOtherRK) return next();
                                  client.sismember(k, queueStr, (e, rep) => {
                                    if (e) return next(e);
                                    if (rep === 1) stillBoundViaOtherRK = true;
                                    next();
                                  });
                                },
                                (e) => cbx(e || null),
                              );
                            },
                          ],
                          (err) => cb1(err),
                        );
                      },

                      (_: void, cb1) => {
                        const multi = client.multi();
                        multi.srem(keyRoutingKeyQueues, queueStr);
                        if (currentCount === 1) {
                          multi.srem(
                            keyExchangeRoutingKeys,
                            validatedRoutingKey,
                          );
                        }
                        if (!stillBoundViaOtherRK) {
                          multi.srem(keyQueueExchangeBindings, exchangeStr);
                        }
                        cb1(null, { multi });
                      },
                    ],
                    done,
                  );
                },
                (err) => {
                  if (err) return cb(err);
                  this.logger.info(
                    `unbindQueue: unbound q=${queueParams.name} ns=${queueParams.ns} from ex=${exchangeParams.name} ns=${exchangeParams.ns} rk=${validatedRoutingKey}`,
                  );
                  cb();
                },
              ),
          ],
          (err) => outerCb(err),
        );
      }, callback);
    });
  }

  /**
   * Deletes a direct exchange from the system.
   *
   * This method performs a comprehensive and safe deletion of a direct exchange with
   * extensive validation and cleanup. The deletion process ensures data integrity
   * and prevents orphaned data structures in Redis.
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
   * directExchange.delete('old-order-events', (err) => {
   *   if (err) {
   *     console.error('Failed to delete exchange:', err);
   *   } else {
   *     console.log('Exchange deleted successfully');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await directExchange.delete('old-order-events');
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
      if (exchangeParams instanceof Error) {
        this.logger.error('delete: invalid exchange params');
        return callback(exchangeParams);
      }

      const { keyExchanges } = redisKeys.getMainKeys();
      const { keyNamespaceExchanges } = redisKeys.getNamespaceKeys(
        exchangeParams.ns,
      );

      const { keyExchange } = redisKeys.getExchangeKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );

      const { keyExchangeRoutingKeys } = redisKeys.getExchangeDirectKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );

      const exchangeStr = JSON.stringify(exchangeParams);

      this.logger.debug(
        `delete: direct exchange ex=${exchangeParams.name}@${exchangeParams.ns}`,
      );

      withSharedPoolConnection((client, outerCb) => {
        withWatchTransaction(
          client,
          (client, watch, done) => {
            let routingKeysAll: string[] = [];

            async.waterfall(
              [
                (cb1: ICallback<void>) => {
                  const baseWatchKeys: string[] = [
                    keyExchange,
                    keyExchangeRoutingKeys,
                    keyExchanges,
                    keyNamespaceExchanges,
                  ];
                  watch(baseWatchKeys, cb1);
                },

                (_: void, cb1: ICallback<void>) =>
                  _validateExchange(client, exchangeParams, true, cb1),

                (_: void, cb1: ICallback<string[]>) => {
                  client.smembers(keyExchangeRoutingKeys, (err, keys) => {
                    if (err) return cb1(err);
                    routingKeysAll = keys ?? [];
                    this.logger.debug(
                      `delete: routingKeys=${routingKeysAll.length} ns=${exchangeParams.ns} ex=${exchangeParams.name}`,
                    );
                    cb1(null, routingKeysAll);
                  });
                },

                (routingKeys: string[], cb1: ICallback<string[]>) => {
                  if (!routingKeys.length) return cb1(null, routingKeys);
                  const derivedKeys = routingKeys.map((rk) => {
                    const { keyRoutingKeyQueues } =
                      redisKeys.getExchangeDirectRoutingKeyKeys(
                        exchangeParams.ns,
                        exchangeParams.name,
                        rk,
                      );
                    return keyRoutingKeyQueues;
                  });
                  watch(derivedKeys, (err) => cb1(err || null, routingKeys));
                },

                (routingKeys: string[], cb1: ICallback<string[]>) => {
                  if (!routingKeys.length) return cb1(null, routingKeys);

                  let hasBoundQueues = false;
                  async.eachOf(
                    routingKeys,
                    (rk, _idx, next) => {
                      const { keyRoutingKeyQueues } =
                        redisKeys.getExchangeDirectRoutingKeyKeys(
                          exchangeParams.ns,
                          exchangeParams.name,
                          rk,
                        );
                      client.scard(keyRoutingKeyQueues, (err, count) => {
                        if (!err && count && count > 0) {
                          hasBoundQueues = true;
                          this.logger.debug(
                            `delete: rk has bound queues rk=${rk}`,
                          );
                        }
                        next(err || null);
                      });
                    },
                    (err) => {
                      if (err) return cb1(err);
                      if (hasBoundQueues) {
                        this.logger.warn(
                          'delete: exchange has bound queues, aborting',
                        );
                        return cb1(new ExchangeHasBoundQueuesError());
                      }
                      cb1(null, routingKeys);
                    },
                  );
                },

                (
                  routingKeys: string[],
                  cb1: ICallback<IWatchTransactionAttemptResult>,
                ) => {
                  const multi = client.multi();
                  multi.del(keyExchange);
                  multi.del(keyExchangeRoutingKeys);
                  multi.srem(keyExchanges, exchangeStr);
                  multi.srem(keyNamespaceExchanges, exchangeStr);
                  for (const rk of routingKeys) {
                    const { keyRoutingKeyQueues } =
                      redisKeys.getExchangeDirectRoutingKeyKeys(
                        exchangeParams.ns,
                        exchangeParams.name,
                        rk,
                      );
                    multi.del(keyRoutingKeyQueues);
                  }
                  cb1(null, { multi });
                },
              ],
              done,
            );
          },
          (err) => {
            if (err) return outerCb(err);
            this.logger.info(
              `delete: deleted direct exchange ex=${exchangeParams.name}@${exchangeParams.ns}`,
            );
            outerCb();
          },
          {
            maxAttempts: 5,
            onRetry: (attemptNo, maxAttempts) => {
              this.logger.warn(
                `delete: concurrent modification detected, retrying attempt=${attemptNo}/${maxAttempts}`,
              );
            },
          },
        );
      }, callback);
    });
  }

  /**
   * Retrieves all bindings for a direct exchange.
   *
   * This method returns a complete mapping of routing keys to the queues bound to them.
   *
   * @param exchange - The exchange identifier (string name or object with ns/name)
   * @param cb - Optional callback invoked with the bindings mapping
   * @returns {Promise<Record<string, IQueueParams[]>> | void} - Returns a Promise if no callback is provided
   *
   * @throws InvalidExchangeParametersError
   *
   * @example
   * ```typescript
   * // Callback pattern
   * directExchange.getBindings('order-events', (err, bindings) => {
   *   if (err) {
   *     console.error('Failed to get bindings:', err);
   *   } else {
   *     console.log('Bindings:', bindings);
   *     for (const [key, queues] of Object.entries(bindings)) {
   *       console.log(`Routing key "${key}": ${queues.length} queues`);
   *     }
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   const bindings = await directExchange.getBindings('order-events');
   *   for (const [key, queues] of Object.entries(bindings)) {
   *     console.log(`Routing key "${key}": ${queues.length} queues`);
   *   }
   * } catch (err) {
   *   console.error('Failed to get bindings:', err);
   * }
   * ```
   */
  getBindings(
    exchange: string | IExchangeParams,
  ): Promise<Record<string, IQueueParams[]>>;
  getBindings(
    exchange: string | IExchangeParams,
    cb: ICallback<Record<string, IQueueParams[]>>,
  ): void;
  getBindings(
    exchange: string | IExchangeParams,
    cb?: ICallback<Record<string, IQueueParams[]>>,
  ): Promise<Record<string, IQueueParams[]>> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const exchangeParams = _parseExchangeParams(
        exchange,
        EExchangeType.DIRECT,
      );
      if (exchangeParams instanceof Error) return callback(exchangeParams);
      withSharedPoolConnection((client, done) => {
        async.waterfall(
          [
            (cb: ICallback<string[]>) => {
              _getRoutingKeys(client, exchangeParams, cb);
            },
            (routingKeys, done: ICallback<Record<string, IQueueParams[]>>) => {
              const bindings: Record<string, IQueueParams[]> = {};
              async.eachOf(
                routingKeys,
                (routingKey, _, done) => {
                  bindings[routingKey] = [];
                  _getRoutingKeyBoundQueues(
                    client,
                    exchangeParams,
                    routingKey,
                    (err, queues) => {
                      if (err) return done(err);
                      bindings[routingKey].push(...(queues ?? []));
                      done();
                    },
                  );
                },
                (err) => {
                  if (err) return done(err);
                  done(null, bindings);
                },
              );
            },
          ],
          done,
        );
      }, callback);
    });
  }
}
