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
import { withSharedPoolConnection } from '../../common/redis-connection-pool/with-shared-pool-connection.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import {
  ExchangeHasBoundQueuesError,
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
import { _getDirectExchangeRoutingKeyQueues } from './_/_get-direct-exchange-routing-key-queues.js';
import { _getDirectExchangeRoutingKeys } from './_/_get-direct-exchange-routing-keys.js';

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
 * Routing Behavior:
 * - Messages are routed only to queues with matching routing keys
 * - If no queues match the routing key, the message is not delivered
 * - Multiple queues can share the same routing key for load distribution
 * - Routing keys are validated and normalized for Redis compatibility
 *
 * @example
 * ```typescript
 * const directExchange = new ExchangeDirect();
 *
 * // Bind queues to specific routing keys
 * directExchange.bindQueue('user-notifications', 'user-events', 'user.created', (err) => {
 *   if (err) {
 *     console.error('Failed to bind queue:', err);
 *     return;
 *   }
 *   console.log('Queue bound to routing key successfully');
 * });
 *
 * // Find queues matching a routing key
 * directExchange.matchQueues('user-events', 'user.created', (err, queues) => {
 *   if (err) {
 *     console.error('Failed to match queues:', err);
 *     return;
 *   }
 *   console.log('Matching queues:', queues);
 * });
 *
 * // Unbind queue from routing key
 * directExchange.unbindQueue('user-notifications', 'user-events', 'user.created', (err) => {
 *   if (!err) console.log('Queue unbound successfully');
 * });
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
   * @param exchange - Exchange identifier. Either the exchange name as a string
   *                  or an object with explicit namespace and name: { ns, name }.
   * @param cb - Node.js-style callback invoked with the list of routing keys bound to the exchange.
   *
   * @throws {InvalidExchangeParametersError} When exchange parameters are invalid
   * @throws {Error} When Redis operations fail
   *
   * @example
   * ```typescript
   * // Using exchange name (namespace resolved internally)
   * getRoutingKeys('orders', (err, keys) => {
   *   if (err) console.error(err);
   *   // keys is string[]
   * });
   *
   * // Using explicit namespace and name
   * getRoutingKeys({ ns: 'prod', name: 'orders' }, (err, keys) => {
   *   if (err) console.error(err);
   *   // keys is string[]
   * });
   * ```
   */
  getRoutingKeys(exchange: string | IExchangeParams, cb: ICallback<string[]>) {
    const exchangeParams = _parseExchangeParams(exchange, EExchangeType.DIRECT);
    if (exchangeParams instanceof Error) return cb(exchangeParams);
    withSharedPoolConnection(
      (client, done) =>
        _getDirectExchangeRoutingKeys(client, exchangeParams, done),
      cb,
    );
  }

  /**
   * Retrieves all queues bound to a specific routing key for a direct exchange.
   *
   * @param exchange - Exchange identifier. Either the exchange name as a string
   *                   or an object with explicit namespace and name: { ns, name }.
   * @param routingKey - Routing key to resolve. The key is validated and normalized to lowercase.
   * @param cb - Node.js-style callback invoked with the list of queues bound under the routing key.
   *
   * @throws {InvalidExchangeParametersError} When exchange parameters are invalid
   * @throws {InvalidDirectExchangeParametersError} When the routing key format is invalid
   * @throws {Error} When Redis operations fail
   *
   * @example
   * ```typescript
   * // Using exchange name
   * getRoutingKeyQueues('orders', 'created', (err, queues) => {
   *   if (err) { // handle error }
   *   // queues is IQueueParams[]: [{ ns: 'prod', name: 'shipping' }, ...]
   * });
   * // Using explicit namespace and name
   * getRoutingKeyQueues({ ns: 'prod', name: 'orders' }, 'updated', (err, queues) => {
   *   if (err) { // handle error }
   *   // queues is IQueueParams[]
   * });
   * ```
   */
  getRoutingKeyQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback<IQueueParams[]>,
  ) {
    const exchangeParams = _parseExchangeParams(exchange, EExchangeType.DIRECT);
    if (exchangeParams instanceof Error) return cb(exchangeParams);

    const validatedRoutingKey = redisKeys.validateRedisKey(routingKey);
    if (validatedRoutingKey instanceof Error)
      return cb(new InvalidDirectExchangeParametersError());

    withSharedPoolConnection((client, done) => {
      _getDirectExchangeRoutingKeyQueues(
        client,
        exchangeParams,
        validatedRoutingKey,
        done,
      );
    }, cb);
  }

  /**
   * Retrieves all queues bound to the specified routing key in a direct exchange.
   *
   * This method performs an exact match lookup for the given routing key and returns
   * all queues that are bound to it. In direct exchanges, only queues with exact
   * routing key matches will receive messages, making this method essential for
   * understanding message routing behavior.
   *
   * @param exchange - The exchange identifier. Can be a string (exchange name) or
   *                  an object with name and namespace properties. If namespace is
   *                  not specified, the default namespace from configuration is used.
   * @param routingKey - The routing key to match against. Must be a valid Redis key
   *                    format (alphanumeric characters, hyphens, underscores, dots).
   * @param cb - Callback function called with the list of matching queues or an error
   *
   * @throws {InvalidExchangeParametersError} When exchange parameters are invalid
   * @throws {InvalidDirectExchangeParametersError} When the routing key format is invalid
   * @throws {ExchangeError} When the exchange is not found or is not a direct exchange
   * @throws {CallbackEmptyReplyError} When Redis returns an unexpected empty response
   * @throws {Error} When Redis operations fail
   *
   * @example
   * ```typescript
   * const directExchange = new ExchangeDirect();
   *
   * // Match queues for a specific routing key
   * directExchange.matchQueues('order-events', 'order.created', (err, queues) => {
   *   if (err) {
   *     if (err instanceof InvalidDirectExchangeParametersError) {
   *       console.error('Invalid routing key format');
   *     } else if (err instanceof ExchangeError) {
   *       console.error('Exchange not found or wrong type');
   *     } else {
   *       console.error('Failed to match queues:', err);
   *     }
   *     return;
   *   }
   *
   *   console.log(`Found ${queues.length} queues for routing key 'order.created':`);
   *   queues.forEach(queue => {
   *     console.log(`- Queue: ${queue.name} (namespace: ${queue.ns})`);
   *   });
   * });
   *
   * // Match with explicit namespace
   * directExchange.matchQueues(
   *   { name: 'user-events', ns: 'production' },
   *   'user.login',
   *   (err, queues) => {
   *     if (!err) {
   *       console.log('Production queues for user.login:', queues);
   *     }
   *   }
   * );
   *
   * // Handle case with no matching queues
   * directExchange.matchQueues('notifications', 'sms.send', (err, queues) => {
   *   if (!err) {
   *     if (queues.length === 0) {
   *       console.log('No queues bound to routing key sms.send');
   *     } else {
   *       console.log('SMS queues found:', queues);
   *     }
   *   }
   * });
   * ```
   */
  matchQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback<IQueueParams[]>,
  ): void {
    const exchangeParams = _parseExchangeParams(exchange, this.type);
    if (exchangeParams instanceof Error) {
      this.logger.error('matchQueues: invalid exchange params');
      return cb(exchangeParams);
    }

    const validatedRoutingKey = redisKeys.validateRedisKey(routingKey);
    if (validatedRoutingKey instanceof Error) {
      this.logger.error(`matchQueues: invalid routing key "${routingKey}"`);
      return cb(new InvalidDirectExchangeParametersError());
    }

    this.logger.debug(
      `matchQueues: resolving queues ns=${exchangeParams.ns} ex=${exchangeParams.name} rk=${validatedRoutingKey}`,
    );

    withSharedPoolConnection((client, done) => {
      const result: IQueueParams[] = [];
      async.series(
        [
          // Validate exchange type persisted in Redis
          (cb1: ICallback) =>
            _validateExchange(client, exchangeParams, true, cb1),
          // Load queues bound to the routing key
          (cb1: ICallback) =>
            _getDirectExchangeRoutingKeyQueues(
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
    }, cb);
  }

  create(
    exchange: string | IExchangeParams,
    queuePolicy: EExchangeQueuePolicy,
    cb: ICallback,
  ) {
    const exchangeParams = _parseExchangeParams(exchange, this.type);
    if (exchangeParams instanceof Error)
      return cb(new InvalidDirectExchangeParametersError());
    withSharedPoolConnection(
      (client, cb) => _saveExchange(client, exchangeParams, queuePolicy, cb),
      cb,
    );
  }

  /**
   * Binds a queue to a direct exchange with a specific routing key.
   *
   * This method creates a binding between a queue and a direct exchange for a specific
   * routing key. Messages published to the exchange with this routing key will be
   * delivered to the bound queue. Multiple queues can be bound to the same routing key
   * for load distribution or redundancy.
   *
   * The operation is idempotent - binding the same queue to the same routing key
   * multiple times will succeed without error.
   *
   * @param queue - The queue to bind. Can be a string (queue name) or an object
   *               with name and namespace properties.
   * @param exchange - The exchange to bind to. Can be a string (exchange name) or
   *                  an object with name and namespace properties.
   * @param routingKey - The routing key for message routing. Must be a valid Redis key
   *                    format (alphanumeric characters, hyphens, underscores, dots).
   * @param cb - Callback function called when the binding operation completes
   *
   * @throws {InvalidQueueParametersError} When queue parameters are invalid
   * @throws {InvalidExchangeParametersError} When exchange parameters are invalid
   * @throws {InvalidDirectExchangeParametersError} When the routing key format is invalid
   * @throws {QueueNotFoundError} When the specified queue does not exist
   * @throws {NamespaceMismatchError} When namespace mismatch occurs
   * @throws {ExchangeError} When exchange type is invalid
   *                        or concurrent modifications are detected
   * @throws {Error} When Redis operations fail
   *
   * @example
   * ```typescript
   * const directExchange = new ExchangeDirect();
   *
   * // Bind a queue to handle order creation events
   * directExchange.bindQueue('order-processor', 'order-events', 'order.created', (err) => {
   *   if (err) {
   *     if (err instanceof QueueNotFoundError) {
   *       console.error('Queue order-processor does not exist');
   *     } else if (err instanceof InvalidDirectExchangeParametersError) {
   *       console.error('Invalid routing key format');
   *     } else if (err instanceof ExchangeError) {
   *       console.error('Exchange error:', err.message);
   *     } else {
   *       console.error('Binding failed:', err);
   *     }
   *     return;
   *   }
   *
   *   console.log('Queue bound to routing key successfully');
   * });
   *
   * // Bind with explicit namespaces
   * directExchange.bindQueue(
   *   { name: 'email-service', ns: 'production' },
   *   { name: 'notifications', ns: 'production' },
   *   'email.send',
   *   (err) => {
   *     if (!err) {
   *       console.log('Production email service bound successfully');
   *     }
   *   }
   * );
   *
   * // Bind multiple queues to the same routing key for load balancing
   * const queues = ['worker-1', 'worker-2', 'worker-3'];
   * queues.forEach((queueName, index) => {
   *   directExchange.bindQueue(queueName, 'task-exchange', 'task.process', (err) => {
   *     if (!err) {
   *       console.log(`Worker ${index + 1} bound to task processing`);
   *     }
   *   });
   * });
   *
   * // Bind different routing keys to the same queue for multiple event types
   * const eventTypes = ['user.created', 'user.updated', 'user.deleted'];
   * eventTypes.forEach(eventType => {
   *   directExchange.bindQueue('user-audit-log', 'user-events', eventType, (err) => {
   *     if (!err) {
   *       console.log(`Audit log bound to ${eventType} events`);
   *     }
   *   });
   * });
   * ```
   */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback,
  ): void {
    const queueParams = _parseQueueParams(queue);
    const exchangeParams = _parseExchangeParams(exchange, this.type);
    if (queueParams instanceof Error) {
      this.logger.error('bindQueue: invalid queue params');
      return cb(queueParams);
    }
    if (exchangeParams instanceof Error) {
      this.logger.error('bindQueue: invalid exchange params');
      return cb(exchangeParams);
    }

    if (queueParams.ns !== exchangeParams.ns) {
      this.logger.error(
        `bindQueue: namespace mismatch q.ns=${queueParams.ns} ex.ns=${exchangeParams.ns}`,
      );
      return cb(new NamespaceMismatchError());
    }

    const validatedRoutingKey = redisKeys.validateRedisKey(routingKey);
    if (validatedRoutingKey instanceof Error) {
      this.logger.error(`bindQueue: invalid routing key "${routingKey}"`);
      return cb(new InvalidDirectExchangeParametersError());
    }

    const { keyQueueProperties, keyQueueExchangeBindings } =
      redisKeys.getQueueKeys(queueParams, null);
    const { keyExchange, keyExchangeRoutingKeys } =
      redisKeys.getExchangeDirectKeys(exchangeParams.ns, exchangeParams.name);
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
      withWatchTransaction(
        client,
        (client, watch, done) => {
          let exchangeQueuePolicy: EExchangeQueuePolicy | null = null;

          async.waterfall(
            [
              // 1) WATCH base keys BEFORE any reads that inform writes
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

              // 2) Validate queue/exchange binding and compute exchange policy (under WATCH)
              (_: void, cb1: ICallback<void>) =>
                _validateQueueBinding(
                  client,
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

              // 3) Ensure not already bound (under WATCH)
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

              // 4) Build MULTI to persist meta, indexes, and the binding atomically
              (_: void, cb1: ICallback<IWatchTransactionAttemptResult>) => {
                const typeField = String(EExchangeProperty.TYPE);
                const queuePolicyField = String(EExchangeProperty.QUEUE_POLICY);

                const multi = client.multi();

                // Persist exchange meta as a hash
                multi.hset(keyExchange, typeField, EExchangeType.DIRECT);
                multi.hset(
                  keyExchange,
                  queuePolicyField,
                  Number(exchangeQueuePolicy),
                );

                // Register exchange in global and namespace indexes
                multi.sadd(keyExchanges, exchangeStr);
                multi.sadd(keyNamespaceExchanges, exchangeStr);

                // Maintain routing keys index for the exchange
                multi.sadd(keyExchangeRoutingKeys, validatedRoutingKey);

                // Add queue to the routing key queues set
                multi.sadd(keyRoutingKeyQueues, queueStr);

                // Maintain reverse index: record that this queue is bound to this exchange
                multi.sadd(keyQueueExchangeBindings, exchangeStr);

                cb1(null, { multi });
              },
            ],
            done,
          );
        },
        (err) => {
          if (err) {
            // Idempotent: treat already-bound as success
            if (err instanceof QueueAlreadyBound) return outerCb();
            return outerCb(err);
          }
          this.logger.info(
            `bindQueue: bound q=${queueParams.name} ns=${queueParams.ns} -> ex=${exchangeParams.name} ns=${exchangeParams.ns} rk=${validatedRoutingKey}`,
          );
          outerCb();
        },
      );
    }, cb);
  }

  /**
   * Unbinds a queue from a direct exchange for a specific routing key.
   *
   * This method removes the binding between a queue and a direct exchange for the
   * specified routing key. After unbinding, messages published to the exchange with
   * this routing key will no longer be delivered to the unbound queue. Other queues
   * bound to the same routing key will continue to receive messages.
   *
   * @param queue - The queue to unbind. Can be a string (queue name) or an object
   *               with name and namespace properties.
   * @param exchange - The exchange to unbind from. Can be a string (exchange name) or
   *                  an object with name and namespace properties.
   * @param routingKey - The routing key to unbind from. Must match the exact routing key
   *                    used during binding.
   * @param cb - Callback function called when the unbinding operation completes
   *
   * @throws {InvalidQueueParametersError} When queue parameters are invalid
   * @throws {InvalidExchangeParametersError} When exchange parameters are invalid
   * @throws {InvalidDirectExchangeParametersError} When the routing key format is invalid
   * @throws {NamespaceMismatchError} When namespace mismatch occurs
   * @throws {ExchangeError} When exchange type is invalid
   *                        exchange is not found, or concurrent modifications are detected
   * @throws {QueueNotBoundError} When the queue is not currently bound to the routing key
   * @throws {Error} When Redis operations fail
   *
   * @example
   * ```typescript
   * const directExchange = new ExchangeDirect();
   *
   * // Unbind a queue from a specific routing key
   * directExchange.unbindQueue('order-processor', 'order-events', 'order.created', (err) => {
   *   if (err) {
   *     if (err instanceof QueueNotBoundError) {
   *       console.error('Queue is not bound to this routing key');
   *     } else if (err instanceof InvalidDirectExchangeParametersError) {
   *       console.error('Invalid routing key format');
   *     } else if (err instanceof ExchangeError) {
   *       console.error('Exchange error:', err.message);
   *     } else {
   *       console.error('Unbinding failed:', err);
   *     }
   *     return;
   *   }
   *
   *   console.log('Queue unbound from routing key successfully');
   * });
   *
   * // Unbind with explicit namespaces
   * directExchange.unbindQueue(
   *   { name: 'email-service', ns: 'production' },
   *   { name: 'notifications', ns: 'production' },
   *   'email.send',
   *   (err) => {
   *     if (!err) {
   *       console.log('Production email service unbound successfully');
   *     }
   *   }
   * );
   *
   * // Unbind multiple queues from the same routing key
   * const queues = ['worker-1', 'worker-2', 'worker-3'];
   * queues.forEach((queueName, index) => {
   *   directExchange.unbindQueue(queueName, 'task-exchange', 'task.process', (err) => {
   *     if (!err) {
   *       console.log(`Worker ${index + 1} unbound from task processing`);
   *     }
   *   });
   * });
   *
   * // Unbind a queue from multiple routing keys
   * const eventTypes = ['user.created', 'user.updated', 'user.deleted'];
   * eventTypes.forEach(eventType => {
   *   directExchange.unbindQueue('user-audit-log', 'user-events', eventType, (err) => {
   *     if (!err) {
   *       console.log(`Audit log unbound from ${eventType} events`);
   *     }
   *   });
   * });
   *
   * // Handle graceful service shutdown
   * function shutdownService() {
   *   directExchange.unbindQueue('my-service', 'app-events', 'service.task', (err) => {
   *     if (err) {
   *       console.error('Failed to unbind during shutdown:', err);
   *     } else {
   *       console.log('Service unbound, safe to shutdown');
   *       process.exit(0);
   *     }
   *   });
   * }
   * ```
   */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback,
  ): void {
    const queueParams = _parseQueueParams(queue);
    const exchangeParams = _parseExchangeParams(exchange, this.type);
    if (queueParams instanceof Error) {
      this.logger.error('unbindQueue: invalid queue params');
      return cb(queueParams);
    }
    if (exchangeParams instanceof Error) {
      this.logger.error('unbindQueue: invalid exchange params');
      return cb(exchangeParams);
    }

    if (queueParams.ns !== exchangeParams.ns) {
      this.logger.error('unbindQueue: namespace mismatch');
      return cb(new NamespaceMismatchError());
    }

    const validatedRoutingKey = redisKeys.validateRedisKey(routingKey);
    if (validatedRoutingKey instanceof Error) {
      this.logger.error(`unbindQueue: invalid routing key "${routingKey}"`);
      return cb(new InvalidDirectExchangeParametersError());
    }

    const { keyQueueExchangeBindings } = redisKeys.getQueueKeys(
      queueParams,
      null,
    );
    const { keyExchange, keyExchangeRoutingKeys } =
      redisKeys.getExchangeDirectKeys(exchangeParams.ns, exchangeParams.name);
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
      withWatchTransaction(
        client,
        // Attempt function: perform WATCHed reads, validations, and build MULTI
        (client, watch, done) => {
          let routingKeysAll: string[] = [];
          let otherRoutingKeySets: string[] = [];
          let currentCount = 0;
          let stillBoundViaOtherRK = false;

          async.waterfall(
            [
              // 1) WATCH base keys before any reads
              (cb1: ICallback<void>) => {
                const baseWatchKeys = [
                  keyExchange,
                  keyExchangeRoutingKeys,
                  keyRoutingKeyQueues,
                  keyQueueExchangeBindings,
                ];
                watch(baseWatchKeys, cb1);
              },

              // 2) Validate exchange (type) under WATCH
              (_: void, cb1: ICallback<void>) =>
                _validateExchange(client, exchangeParams, true, cb1),

              // 3) Ensure the queue is currently bound to this routing key (under WATCH)
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

              // 4) Read all routing keys of the exchange (under WATCH)
              (_: void, cb1: ICallback<void>) => {
                client.smembers(keyExchangeRoutingKeys, (err, keys) => {
                  if (err) return cb1(err);
                  routingKeysAll = keys ?? [];
                  cb1();
                });
              },

              // 5) WATCH derived per-routing-key queue sets for still-bound detection
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

              // 6) Compute current counts/flags (all reads happen under WATCH)
              (_: void, cb1: ICallback<void>) => {
                async.series(
                  [
                    // Count how many queues remain on this routing key
                    (cbx: ICallback<void>) =>
                      client.scard(keyRoutingKeyQueues, (err, count) => {
                        if (err) return cbx(err);
                        currentCount = count || 0;
                        cbx();
                      }),

                    // Check if queue is still bound via any other routing key
                    (cbx: ICallback<void>) => {
                      if (otherRoutingKeySets.length === 0) return cbx();
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

              // 7) Build MULTI to be executed by the helper
              (_: void, cb1) => {
                const multi = client.multi();

                // Always remove the queue from the current routing key set
                multi.srem(keyRoutingKeyQueues, queueStr);

                // If this was the last queue for this routing key, remove the routing key from the exchange index
                if (currentCount === 1) {
                  multi.srem(keyExchangeRoutingKeys, validatedRoutingKey);
                }

                // If queue is no longer bound to this exchange via any routing key, remove reverse index entry
                if (!stillBoundViaOtherRK) {
                  multi.srem(keyQueueExchangeBindings, exchangeStr);
                }

                cb1(null, { multi });
              },
            ],
            done,
          );
        },
        // Final callback after successful EXEC (or error)
        (err) => {
          if (err) return outerCb(err);
          this.logger.info('unbindQueue: unbound');
          outerCb();
        },
      );
    }, cb);
  }

  /**
   * Deletes a direct exchange from the system.
   *
   * This method performs a comprehensive and safe deletion of a direct exchange with
   * extensive validation and cleanup. The deletion process ensures data integrity
   * and prevents orphaned data structures in Redis.
   *
   * @param exchange - The exchange identifier. Can be a string (exchange name) or
   *                  an object with name and namespace properties.
   * @param cb - Callback function called when the deletion completes
   *
   * @throws {InvalidExchangeParametersError} When exchange parameters are invalid
   * @throws {ExchangeError} When the exchange is not found, is not a direct exchange,
   *                        or concurrent modifications are detected
   * @throws {ExchangeHasBoundQueuesError} When the exchange still has bound queues
   * @throws {Error} When Redis operations fail
   *
   * @example
   * ```typescript
   * const directExchange = new ExchangeDirect();
   *
   * // Delete an exchange (must have no bound queues)
   * directExchange.delete('old-order-events', (err) => {
   *   if (err) {
   *     if (err instanceof ExchangeHasBoundQueuesError) {
   *       console.error('Cannot delete: exchange has bound queues');
   *       // Need to unbind all queues first
   *       console.log('Unbind all queues before deletion');
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
   * directExchange.delete(
   *   { name: 'temp-exchange', ns: 'testing' },
   *   (err) => {
   *     if (!err) {
   *       console.log('Testing exchange deleted');
   *     }
   *   }
   * );
   *
   * // Safe deletion workflow: unbind all queues first
   * async function safeDeleteExchange(exchangeName) {
   *   // First, get all routing keys and their bound queues
   *   const routingKeys = ['order.created', 'order.updated', 'order.deleted'];
   *
   *   // Unbind all queues from all routing keys
   *   for (const routingKey of routingKeys) {
   *     directExchange.matchQueues(exchangeName, routingKey, (err, queues) => {
   *       if (!err && queues.length > 0) {
   *         queues.forEach(queue => {
   *           directExchange.unbindQueue(queue, exchangeName, routingKey, (unbindErr) => {
   *             if (unbindErr) {
   *               console.error(`Failed to unbind ${queue.name}:`, unbindErr);
   *             }
   *           });
   *         });
   *       }
   *     });
   *   }
   *
   *   // Wait a moment for unbinding to complete, then delete
   *   setTimeout(() => {
   *     directExchange.delete(exchangeName, (deleteErr) => {
   *       if (!deleteErr) {
   *         console.log('Exchange safely deleted');
   *       }
   *     });
   *   }, 1000);
   * }
   *
   * // Delete during application shutdown
   * process.on('SIGTERM', () => {
   *   directExchange.delete('app-events', (err) => {
   *     if (err) {
   *       console.error('Failed to delete exchange during shutdown:', err);
   *     }
   *     process.exit(err ? 1 : 0);
   *   });
   * });
   * ```
   */
  delete(exchange: string | IExchangeParams, cb: ICallback): void {
    const exchangeParams = _parseExchangeParams(exchange, this.type);
    if (exchangeParams instanceof Error) {
      this.logger.error('delete: invalid exchange params');
      return cb(exchangeParams);
    }

    const { keyExchanges } = redisKeys.getMainKeys();
    const { keyNamespaceExchanges } = redisKeys.getNamespaceKeys(
      exchangeParams.ns,
    );

    const { keyExchange, keyExchangeRoutingKeys } =
      redisKeys.getExchangeDirectKeys(exchangeParams.ns, exchangeParams.name);

    const exchangeStr = JSON.stringify(exchangeParams);

    this.logger.debug(
      `delete: direct exchange ns=${exchangeParams.ns} ex=${exchangeParams.name}`,
    );

    withSharedPoolConnection((client, outerCb) => {
      withWatchTransaction(
        client,
        (client, watch, done) => {
          let routingKeysAll: string[] = [];

          async.waterfall(
            [
              // 1) WATCH base keys first so subsequent reads are protected
              (cb1: ICallback<void>) => {
                const baseWatchKeys: string[] = [
                  keyExchange,
                  keyExchangeRoutingKeys,
                  keyExchanges,
                  keyNamespaceExchanges,
                ];
                watch(baseWatchKeys, cb1);
              },

              // 2) Validate exchange under WATCH
              (_: void, cb1: ICallback<void>) =>
                _validateExchange(client, exchangeParams, true, cb1),

              // 3) Read routing keys under WATCH
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

              // 4) WATCH derived per-routing-key queue sets (after we know them)
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

              // 5) Ensure there are no bound queues for any routing key (reads happen after WATCH)
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

              // 6) Delete atomically
              (
                routingKeys: string[],
                cb1: ICallback<IWatchTransactionAttemptResult>,
              ) => {
                const multi = client.multi();

                // Remove exchange meta and routing keys index
                multi.del(keyExchange);
                multi.del(keyExchangeRoutingKeys);

                // Remove from indexes
                multi.srem(keyExchanges, exchangeStr);
                multi.srem(keyNamespaceExchanges, exchangeStr);

                // Delete each per-routing-key queue set
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
          this.logger.info('delete: deleted');
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
    }, cb);
  }
}
