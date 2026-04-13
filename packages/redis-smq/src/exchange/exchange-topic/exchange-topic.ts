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
import { EQueueType, IQueueParams } from '../../queue-manager/index.js';
import { _saveExchange } from '../_/_save-exchange.js';
import { _validateQueueBinding } from '../_/_validate-queue-binding.js';
import {
  EExchangeProperty,
  EExchangeQueuePolicy,
  EExchangeType,
  IExchangeParams,
} from '../index.js';
import { Configuration } from '../../config-manager/configuration.js';
import { _getRoutingPatterns } from './_/_get-routing-patterns.js';
import { _getRoutingPatternBoundQueues } from './_/_get-routing-pattern-bound-queues.js';
import { _parseExchangeParams } from '../_/_parse-exchange-params.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { _parseQueueParams } from '../../queue-manager/_/_parse-queue-params.js';
import {
  ExchangeHasBoundQueuesError,
  InvalidExchangeRoutingKeyError,
  InvalidTopicBindingPatternError,
  InvalidTopicExchangeParamsError,
  NamespaceMismatchError,
  QueueAlreadyBound,
  QueueNotBoundError,
} from '../../errors/index.js';
import { _validateRoutingPattern } from './_/_validate-routing-pattern.js';
import { _matchRoutingKey } from './_/_match-routing-key.js';
import { _validateExchange } from '../_/_validate-exchange.js';
import { _validateOperation } from '../../queue-operation-validator/_/_validate-operation.js';
import { EQueueOperation } from '../../queue-operation-validator/index.js';

/**
 * Topic exchange for pattern-based message routing.
 *
 * Routes messages to queues based on pattern matching between routing keys
 * and binding patterns using AMQP-style wildcards:
 * - '*' matches exactly one token
 * - '#' matches zero or more tokens
 * - Tokens are separated by dots (.)
 *
 * @example
 * const topicExchange = new ExchangeTopic();
 *
 * // Bind a queue with pattern
 * await topicExchange.bindQueue('order-processor', 'events', 'order.#');
 *
 * // Match queues for a routing key
 * const queues = await topicExchange.matchQueues('events', 'order.created');
 */
export class ExchangeTopic {
  protected readonly type = EExchangeType.TOPIC;
  protected readonly logger: ReturnType<typeof createLogger>;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name,
    );
  }

  /**
   * Matches queues for a routing key based on binding patterns.
   *
   * @param exchange - Exchange name (string) or { name, ns }
   * @param routingKey - Routing key to match (e.g., 'order.created')
   * @param cb - (err, queues) => void. Returns IQueueParams[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const queues = await topicExchange.matchQueues('events', 'order.created');
   *
   * // Callback
   * topicExchange.matchQueues('events', 'order.created', (err, queues) => {
   *   if (err) throw err;
   *   console.log(queues);
   * });
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
      const topicParams = _parseExchangeParams(exchange, this.type);
      if (topicParams instanceof Error) {
        return callback(topicParams);
      }

      const validatedRoutingKey = routingKey.trim();
      if (!validatedRoutingKey) {
        return callback(
          new InvalidExchangeRoutingKeyError({
            metadata: {
              exchange: topicParams,
              routingKey: routingKey,
            },
          }),
        );
      }

      withSharedPoolConnection((client, topCb) => {
        _getRoutingPatterns(client, topicParams, (err, patterns) => {
          if (err) return topCb(err);
          const allPatterns = patterns ?? [];
          if (allPatterns.length === 0) return topCb(null, []);

          const matched = allPatterns.filter((p) =>
            _matchRoutingKey(validatedRoutingKey, p),
          );
          if (matched.length === 0) return topCb(null, []);

          const union = new Map<string, IQueueParams>();

          const tasks = matched.map((p) => (tcb: ICallback) => {
            _getRoutingPatternBoundQueues(client, p, topicParams, (e, qs) => {
              if (e) return tcb(e);
              (qs ?? []).forEach((q) => union.set(`${q.name}@${q.ns}`, q));
              tcb();
            });
          });

          async.parallel(tasks, (e) => {
            if (e) return topCb(e);
            topCb(null, Array.from(union.values()));
          });
        });
      }, callback);
    });
  }

  /**
   * Gets all routing patterns registered for a topic exchange.
   *
   * @param exchange - Exchange name (string) or { name, ns }
   * @param cb - (err, patterns) => void. Returns string[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const patterns = await topicExchange.getRoutingPatterns('events');
   *
   * // Callback
   * topicExchange.getRoutingPatterns('events', (err, patterns) => {
   *   if (err) throw err;
   *   console.log(patterns);
   * });
   */
  getRoutingPatterns(exchange: string | IExchangeParams): Promise<string[]>;
  getRoutingPatterns(
    exchange: string | IExchangeParams,
    cb: ICallback<string[]>,
  ): void;
  getRoutingPatterns(
    exchange: string | IExchangeParams,
    cb?: ICallback<string[]>,
  ): Promise<string[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      withSharedPoolConnection(
        (client, cb) => _getRoutingPatterns(client, exchange, cb),
        callback,
      );
    });
  }

  /**
   * Gets all queues bound to a specific routing pattern.
   *
   * @param exchange - Exchange name (string) or { name, ns }
   * @param bindingPattern - Binding pattern (e.g., 'order.#')
   * @param cb - (err, queues) => void. Returns IQueueParams[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const queues = await topicExchange.getRoutingPatternBoundQueues('events', 'order.#');
   *
   * // Callback
   * topicExchange.getRoutingPatternBoundQueues('events', 'order.#', (err, queues) => {
   *   if (err) throw err;
   *   console.log(queues);
   * });
   */
  getRoutingPatternBoundQueues(
    exchange: string | IExchangeParams,
    bindingPattern: string,
  ): Promise<IQueueParams[]>;
  getRoutingPatternBoundQueues(
    exchange: string | IExchangeParams,
    bindingPattern: string,
    cb: ICallback<IQueueParams[]>,
  ): void;
  getRoutingPatternBoundQueues(
    exchange: string | IExchangeParams,
    bindingPattern: string,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      withSharedPoolConnection(
        (client, cb) =>
          _getRoutingPatternBoundQueues(client, bindingPattern, exchange, cb),
        callback,
      );
    });
  }

  /**
   * Binds a queue to a topic exchange with a binding pattern.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param exchange - Exchange name (string) or { name, ns }
   * @param routingPattern - Binding pattern (e.g., 'order.#', 'user.*.created')
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await topicExchange.bindQueue('order-processor', 'events', 'order.#');
   *
   * // Callback
   * topicExchange.bindQueue('order-processor', 'events', 'order.#', (err) => {
   *   if (err) throw err;
   * });
   */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
  ): Promise<void>;
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
    cb: ICallback,
  ): void;
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
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
      if (!_validateRoutingPattern(routingPattern)) {
        return callback(
          new InvalidTopicBindingPatternError({
            metadata: { pattern: routingPattern },
          }),
        );
      }

      const { keyQueueProperties, keyQueueExchangeBindings } =
        redisKeys.getQueueKeys(queueParams.ns, queueParams.name, null);
      const { keyExchange } = redisKeys.getExchangeKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );
      const { keyExchangeBindingPatterns } = redisKeys.getExchangeTopicKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );
      const { keyBindingPatternQueues } =
        redisKeys.getExchangeTopicBindingPatternKeys(
          exchangeParams.ns,
          exchangeParams.name,
          routingPattern,
        );
      const { keyExchanges } = redisKeys.getMainKeys();
      const { keyNamespaceExchanges } = redisKeys.getNamespaceKeys(
        queueParams.ns,
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
                EQueueOperation.BIND_EXCHANGE,
                cb,
              ),
            (cb) =>
              withWatchTransaction(
                client,
                (c, watch, done) => {
                  let exchangeQueuePolicy: EExchangeQueuePolicy | null = null;

                  async.waterfall(
                    [
                      (cb1: ICallback<void>) =>
                        watch(
                          [
                            keyExchange,
                            keyQueueProperties,
                            keyExchangeBindingPatterns,
                            keyBindingPatternQueues,
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
                        c.sismember(
                          keyBindingPatternQueues,
                          queueStr,
                          (err, reply) => {
                            if (err) return cb1(err);
                            if (reply === 1) {
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

                        const multi = c.multi();
                        multi.hset(keyExchange, typeField, EExchangeType.TOPIC);
                        multi.hset(
                          keyExchange,
                          queuePolicyField,
                          Number(exchangeQueuePolicy),
                        );
                        multi.sadd(keyExchanges, exchangeStr);
                        multi.sadd(keyNamespaceExchanges, exchangeStr);
                        multi.sadd(keyExchangeBindingPatterns, routingPattern);
                        multi.sadd(keyBindingPatternQueues, queueStr);
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
                    `bindQueue: bound queue=${queueParams.name}@${queueParams.ns} -> ex=${exchangeParams.name}@${exchangeParams.ns} pat=${routingPattern}`,
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
   * Unbinds a queue from a topic exchange binding pattern.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param exchange - Exchange name (string) or { name, ns }
   * @param routingPattern - Binding pattern to unbind
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await topicExchange.unbindQueue('order-processor', 'events', 'order.cancelled');
   *
   * // Callback
   * topicExchange.unbindQueue('order-processor', 'events', 'order.cancelled', (err) => {
   *   if (err) throw err;
   * });
   */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
  ): Promise<void>;
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
    cb: ICallback,
  ): void;
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
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
      if (!_validateRoutingPattern(routingPattern)) {
        return callback(
          new InvalidTopicBindingPatternError({
            metadata: { pattern: routingPattern },
          }),
        );
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
      const { keyExchangeBindingPatterns } = redisKeys.getExchangeTopicKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );
      const { keyBindingPatternQueues } =
        redisKeys.getExchangeTopicBindingPatternKeys(
          exchangeParams.ns,
          exchangeParams.name,
          routingPattern,
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
                  let allPatterns: string[] = [];
                  let currentPatternCount = 0;
                  let stillBoundViaOtherPattern = false;

                  async.waterfall(
                    [
                      (cb1: ICallback<void>) =>
                        watch(
                          [
                            keyExchange,
                            keyExchangeBindingPatterns,
                            keyBindingPatternQueues,
                            keyQueueExchangeBindings,
                          ],
                          cb1,
                        ),

                      (_: void, cb1: ICallback<void>) =>
                        _validateExchange(c, exchangeParams, true, cb1),

                      (_: void, cb1: ICallback<void>) =>
                        c.sismember(
                          keyBindingPatternQueues,
                          queueStr,
                          (err, reply) => {
                            if (err) return cb1(err);
                            if (reply !== 1)
                              return cb1(new QueueNotBoundError());
                            cb1();
                          },
                        ),

                      (_: void, cb1: ICallback<void>) =>
                        c.smembers(keyExchangeBindingPatterns, (err, pats) => {
                          if (err) return cb1(err);
                          allPatterns = (pats ?? []).filter(
                            (p) => p && p.length,
                          );
                          cb1();
                        }),

                      (_: void, cb1: ICallback<void>) => {
                        const otherPatterns = allPatterns.filter(
                          (p) => p !== routingPattern,
                        );

                        const otherPatternSets = otherPatterns.map((p) => {
                          const { keyBindingPatternQueues: k } =
                            redisKeys.getExchangeTopicBindingPatternKeys(
                              exchangeParams.ns,
                              exchangeParams.name,
                              p,
                            );
                          return k;
                        });

                        const doWatch = (next: ICallback<void>) =>
                          otherPatternSets.length
                            ? watch(otherPatternSets, next)
                            : next();

                        doWatch((err) => {
                          if (err) return cb1(err);

                          async.series(
                            [
                              (cbx: ICallback<void>) =>
                                c.scard(keyBindingPatternQueues, (e, count) => {
                                  if (e) return cbx(e);
                                  currentPatternCount = count || 0;
                                  cbx();
                                }),
                              (cbx: ICallback<void>) => {
                                if (otherPatternSets.length === 0) return cbx();
                                async.eachOf(
                                  otherPatternSets,
                                  (setKey, _i, next) => {
                                    if (stillBoundViaOtherPattern)
                                      return next();
                                    c.sismember(setKey, queueStr, (e2, rep) => {
                                      if (e2) return next(e2);
                                      if (rep === 1)
                                        stillBoundViaOtherPattern = true;
                                      next();
                                    });
                                  },
                                  (e3) => cbx(e3 || null),
                                );
                              },
                            ],
                            (err) => cb1(err),
                          );
                        });
                      },

                      (
                        _: void,
                        cb1: ICallback<IWatchTransactionAttemptResult>,
                      ) => {
                        const multi = c.multi();
                        multi.srem(keyBindingPatternQueues, queueStr);
                        if (currentPatternCount === 1) {
                          multi.srem(
                            keyExchangeBindingPatterns,
                            routingPattern,
                          );
                        }
                        if (!stillBoundViaOtherPattern) {
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
                    `unbindQueue: unbound queue=${queueParams.name}@${queueParams.ns} from ex=${exchangeParams.name}@${exchangeParams.ns} pat=${routingPattern}`,
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
   * Creates a topic exchange.
   *
   * @param exchange - Exchange name (string) or { name, ns }
   * @param queuePolicy - STANDARD or PRIORITY
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await topicExchange.create('events', EExchangeQueuePolicy.STANDARD);
   *
   * // Callback
   * topicExchange.create('events', EExchangeQueuePolicy.STANDARD, (err) => {
   *   if (err) throw err;
   * });
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
        return callback(new InvalidTopicExchangeParamsError());
      withSharedPoolConnection(
        (client, cb) => _saveExchange(client, exchangeParams, queuePolicy, cb),
        callback,
      );
    });
  }

  /**
   * Deletes a topic exchange.
   *
   * @param exchange - Exchange name (string) or { name, ns }
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await topicExchange.delete('events');
   *
   * // Callback
   * topicExchange.delete('events', (err) => {
   *   if (err) throw err;
   * });
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
      const { keyExchange } = redisKeys.getExchangeKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );
      const { keyExchangeBindingPatterns } = redisKeys.getExchangeTopicKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );

      const exchangeStr = JSON.stringify(exchangeParams);

      withSharedPoolConnection((client, outerCb) => {
        withWatchTransaction(
          client,
          (c, watch, done) => {
            let patterns: string[] = [];

            async.waterfall(
              [
                (cb1: ICallback<void>) =>
                  watch(
                    [
                      keyExchange,
                      keyExchangeBindingPatterns,
                      keyExchanges,
                      keyNamespaceExchanges,
                    ],
                    cb1,
                  ),

                (_: void, cb1: ICallback<void>) =>
                  _validateExchange(c, exchangeParams, true, cb1),

                (_: void, cb1: ICallback<void>) =>
                  c.smembers(keyExchangeBindingPatterns, (err, pats) => {
                    if (err) return cb1(err);
                    patterns = (pats ?? []).filter((p) => p && p.length);
                    cb1();
                  }),

                (_: void, cb1: ICallback<void>) => {
                  if (patterns.length === 0) return cb1();
                  const derivedKeys = patterns.map((p) => {
                    const { keyBindingPatternQueues } =
                      redisKeys.getExchangeTopicBindingPatternKeys(
                        exchangeParams.ns,
                        exchangeParams.name,
                        p,
                      );
                    return keyBindingPatternQueues;
                  });
                  watch(derivedKeys, cb1);
                },

                (_: void, cb1: ICallback<void>) => {
                  if (patterns.length === 0) return cb1();

                  let hasBoundQueues = false;
                  async.eachOf(
                    patterns,
                    (p, _idx, next) => {
                      const { keyBindingPatternQueues } =
                        redisKeys.getExchangeTopicBindingPatternKeys(
                          exchangeParams.ns,
                          exchangeParams.name,
                          p,
                        );
                      c.scard(keyBindingPatternQueues, (err, count) => {
                        if (!err && (count || 0) > 0) {
                          hasBoundQueues = true;
                          this.logger.debug(
                            `delete: pattern "${p}" has ${count} bound queue(s)`,
                          );
                        }
                        next(err || null);
                      });
                    },
                    (err) => {
                      if (err) return cb1(err);
                      if (hasBoundQueues)
                        return cb1(new ExchangeHasBoundQueuesError());
                      cb1();
                    },
                  );
                },

                (_: void, cb1: ICallback<IWatchTransactionAttemptResult>) => {
                  const multi = c.multi();
                  multi.del(keyExchange);
                  multi.del(keyExchangeBindingPatterns);
                  multi.srem(keyExchanges, exchangeStr);
                  multi.srem(keyNamespaceExchanges, exchangeStr);
                  for (const p of patterns) {
                    const { keyBindingPatternQueues } =
                      redisKeys.getExchangeTopicBindingPatternKeys(
                        exchangeParams.ns,
                        exchangeParams.name,
                        p,
                      );
                    multi.del(keyBindingPatternQueues);
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
              `delete: exchange ${exchangeParams.name}@${exchangeParams.ns} deleted`,
            );
            outerCb();
          },
        );
      }, callback);
    });
  }

  /**
   * Gets all bindings for a topic exchange.
   *
   * Returns a mapping of routing patterns to the queues bound to them.
   *
   * @param exchange - Exchange name (string) or { name, ns }
   * @param cb - (err, bindings) => void. Returns Record<string, IQueueParams[]>
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const bindings = await topicExchange.getBindings('events');
   * for (const [pattern, queues] of Object.entries(bindings)) {
   *   console.log(`${pattern}: ${queues.length} queues`);
   * }
   *
   * // Callback
   * topicExchange.getBindings('events', (err, bindings) => {
   *   if (err) throw err;
   *   console.log(bindings);
   * });
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
      const exchangeParams = _parseExchangeParams(exchange, this.type);
      if (exchangeParams instanceof Error) return callback(exchangeParams);

      withSharedPoolConnection((client, done) => {
        async.waterfall(
          [
            (cb: ICallback<string[]>) => {
              _getRoutingPatterns(client, exchangeParams, cb);
            },
            (
              bindingPatterns,
              done: ICallback<Record<string, IQueueParams[]>>,
            ) => {
              const bindings: Record<string, IQueueParams[]> = {};
              async.eachOf(
                bindingPatterns,
                (bindingPattern, _, done) => {
                  bindings[bindingPattern] = [];
                  _getRoutingPatternBoundQueues(
                    client,
                    bindingPattern,
                    exchangeParams,
                    (err, queues) => {
                      if (err) return done(err);
                      bindings[bindingPattern].push(...(queues ?? []));
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
