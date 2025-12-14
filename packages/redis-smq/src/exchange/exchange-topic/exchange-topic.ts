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
import { EQueueType, IQueueParams } from '../../queue-manager/index.js';
import { _saveExchange } from '../_/_save-exchange.js';
import { _validateQueueBinding } from '../_/_validate-queue-binding.js';
import {
  EExchangeProperty,
  EExchangeQueuePolicy,
  EExchangeType,
  IExchangeParams,
} from '../index.js';
import { Configuration } from '../../config/index.js';
import { _getTopicExchangeBindingPatterns } from './_/_get-topic-exchange-binding-patterns.js';
import { _getTopicExchangeBindingPatternQueues } from './_/_get-topic-exchange-binding-pattern-queues.js';
import { _parseExchangeParams } from '../_/_parse-exchange-params.js';
import { redisKeys } from '../../common/redis/redis-keys/redis-keys.js';
import { _parseQueueParams } from '../../queue-manager/_/_parse-queue-params.js';
import {
  ExchangeError,
  ExchangeHasBoundQueuesError,
  InvalidTopicExchangeParamsError,
  NamespaceMismatchError,
  QueueAlreadyBound,
  QueueNotBoundError,
} from '../../errors/index.js';
import { _validateTopicExchangeBindingPattern } from './_/_validate-topic-exchange-binding-pattern.js';
import { _matchTopicExchangeBindingPattern } from './_/_match-topic-exchange-binding-pattern.js';
import { _validateExchange } from '../_/_validate-exchange.js';

/**
 * Topic exchange operations.
 *
 * This class manages binding, unbinding, matching, and deleting of topic exchanges.
 * A topic exchange routes messages to queues based on pattern matching between
 * routing keys and binding patterns using AMQP-style wildcards.
 *
 * Topic Pattern Syntax:
 * - Tokens are separated by dots (.)
 * - '*' matches exactly one token
 * - '#' matches zero or more tokens
 * - Literal tokens match exactly
 *
 * @example
 * ```typescript
 * const topicExchange = new ExchangeTopic();
 *
 * // Bind queue to pattern
 * topicExchange.bindQueue(
 *   'order-notifications',
 *   'orders',
 *   'order.*.created',
 *   (err) => { ... }
 * );
 *
 * // Match queues for routing key
 * topicExchange.matchQueues(
 *   'orders',
 *   'order.premium.created',
 *   (err, queues) => { ... }
 * );
 * ```
 */
export class ExchangeTopic {
  /**
   * Exchange type identifier for validation.
   */
  protected readonly type = EExchangeType.TOPIC;

  /**
   * Logger instance. When disabled, its methods are noops to minimize overhead.
   */
  protected readonly logger: ReturnType<typeof createLogger>;

  /**
   * Creates a new ExchangeTopic instance.
   * The logger is namespaced with the class name for consistent logging context.
   */
  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name,
    );
  }

  /**
   * Resolve queues bound to a topic exchange for a given routing key.
   *
   * This method performs pattern matching between the routing key and all binding
   * patterns registered for the exchange. Queues bound to matching patterns are
   * returned, with duplicates removed (a queue may match multiple patterns).
   *
   * Pattern Matching Rules:
   * - 'order.*' matches 'order.created', 'order.updated', but not 'order.item.created'
   * - 'order.#' matches 'order.created', 'order.item.created', 'order.item.variant.updated'
   * - 'order.*.created' matches 'order.premium.created', but not 'order.created'
   *
   * @param exchange - Exchange name or parameter object.
   * @param routingKey - Routing key to match against binding patterns.
   * @param cb - Callback invoked with an array of matching queues or an error.
   *
   * @throws Error via callback on invalid exchange parameters.
   * @throws Error via callback on Redis operations failure.
   *
   * @example
   * ```typescript
   * // Match queues for a specific routing key
   * topicExchange.matchQueues('notifications', 'user.premium.signup', (err, queues) => {
   *   if (err) {
   *     console.error('Failed to match queues:', err);
   *     return;
   *   }
   *
   *   console.log(`Found ${queues.length} matching queues:`);
   *   queues.forEach(q => {
   *     console.log(`- ${q.name} in namespace ${q.ns}`);
   *   });
   * });
   * ```
   */
  matchQueues(
    exchange: string | IExchangeParams,
    routingKey: string,
    cb: ICallback<IQueueParams[]>,
  ): void {
    const topicParams = _parseExchangeParams(exchange, this.type);
    if (topicParams instanceof Error) {
      return cb(topicParams);
    }

    withSharedPoolConnection((client, topCb) => {
      _getTopicExchangeBindingPatterns(client, topicParams, (err, patterns) => {
        if (err) return topCb(err);
        const allPatterns = patterns ?? [];
        if (allPatterns.length === 0) return topCb(null, []);

        const matched = allPatterns.filter((p) =>
          _matchTopicExchangeBindingPattern(routingKey, p),
        );
        if (matched.length === 0) return topCb(null, []);

        const union = new Map<string, IQueueParams>();

        // Fetch queues for each matched pattern in parallel
        const tasks = matched.map((p) => (tcb: ICallback) => {
          _getTopicExchangeBindingPatternQueues(
            client,
            p,
            topicParams,
            (e, qs) => {
              if (e) return tcb(e);
              (qs ?? []).forEach((q) => union.set(`${q.name}@${q.ns}`, q));
              tcb();
            },
          );
        });

        async.parallel(tasks, (e) => {
          if (e) return topCb(e);
          topCb(null, Array.from(union.values()));
        });
      });
    }, cb);
  }

  /**
   * Retrieve all binding patterns registered for a topic exchange.
   *
   * This method returns all patterns that have been used to bind queues to the
   * exchange. Each pattern represents a different routing rule that can match
   * incoming routing keys.
   *
   * @param exchange - Exchange name or parameter object.
   * @param cb - Callback invoked with an array of binding patterns or an error.
   *
   * @throws Error via callback on invalid exchange parameters.
   * @throws Error via callback on Redis operations failure.
   *
   * @example
   * ```typescript
   * topicExchange.getBindingPatterns('notifications', (err, patterns) => {
   *   if (err) {
   *     console.error('Failed to get patterns:', err);
   *     return;
   *   }
   *
   *   console.log('Binding patterns:');
   *   patterns.forEach(pattern => {
   *     console.log(`- ${pattern}`);
   *   });
   * });
   * ```
   */
  getBindingPatterns(
    exchange: string | IExchangeParams,
    cb: ICallback<string[]>,
  ): void {
    withSharedPoolConnection(
      (client, cb) => _getTopicExchangeBindingPatterns(client, exchange, cb),
      cb,
    );
  }

  /**
   * Retrieve all queues bound to a specific binding pattern within a topic exchange.
   *
   * This method returns all queues that are bound to the exchange using the
   * specified binding pattern. This is useful for understanding which queues
   * will receive messages for routing keys that match the pattern.
   *
   * @param exchange - Exchange name or parameter object.
   * @param bindingPattern - The binding pattern to query (e.g., 'order.*.created').
   * @param cb - Callback invoked with an array of queues bound to the pattern or an error.
   *
   * @throws Error via callback on invalid exchange parameters.
   * @throws Error via callback on Redis operations failure.
   *
   * @example
   * ```typescript
   * topicExchange.getBindingPatternQueues(
   *   'notifications',
   *   'user.#',
   *   (err, queues) => {
   *     if (err) {
   *       console.error('Failed to get pattern queues:', err);
   *       return;
   *     }
   *
   *     console.log(`Queues bound to pattern 'user.#':`);
   *     queues.forEach(q => {
   *       console.log(`- ${q.name} in ${q.ns}`);
   *     });
   *   }
   * );
   * ```
   */
  getBindingPatternQueues(
    exchange: string | IExchangeParams,
    bindingPattern: string,
    cb: ICallback<IQueueParams[]>,
  ): void {
    withSharedPoolConnection(
      (client, cb) =>
        _getTopicExchangeBindingPatternQueues(
          client,
          bindingPattern,
          exchange,
          cb,
        ),
      cb,
    );
  }

  /**
   * Bind a queue to a topic exchange using a binding pattern.
   *
   * This method creates a binding between a queue and an exchange using a topic
   * pattern. Messages published to the exchange with routing keys that match
   * the pattern will be routed to the bound queue.
   *
   * Idempotency:
   * - If the binding already exists, the operation succeeds without changes.
   *
   * @param queue - Queue name or parameter object.
   * @param exchange - Exchange name or parameter object.
   * @param routingPattern - Topic binding pattern (e.g., 'order.*.created', 'user.#').
   * @param cb - Callback invoked when the operation completes.
   *
   * @throws QueueNotFoundError via callback if the queue does not exist in the namespace index.
   * @throws NamespaceMismatchError When namespace mismatch occurs
   * @throws ExchangeError via callback on invalid binding pattern or exchange type mismatch.
   * @throws ExchangeError via callback on concurrent modifications.
   *
   * @example
   * ```typescript
   * // Bind queue to receive all order-related events
   * topicExchange.bindQueue(
   *   'order-processor',
   *   'events',
   *   'order.#',
   *   (err) => {
   *     if (err) {
   *       console.error('Failed to bind queue:', err);
   *       return;
   *     }
   *     console.log('Queue bound successfully');
   *   }
   * );
   *
   * // Bind queue to receive only creation events for any entity
   * topicExchange.bindQueue(
   *   { name: 'audit-log', ns: 'production' },
   *   { name: 'events', ns: 'production' },
   *   '*.created',
   *   (err) => { ... }
   * );
   * ```
   */
  bindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
    cb: ICallback,
  ): void {
    const queueParams = _parseQueueParams(queue);
    const exchangeParams = _parseExchangeParams(exchange, this.type);

    if (queueParams instanceof Error) return cb(queueParams);
    if (exchangeParams instanceof Error) return cb(exchangeParams);

    if (queueParams.ns !== exchangeParams.ns) {
      return cb(new NamespaceMismatchError());
    }
    if (!_validateTopicExchangeBindingPattern(routingPattern)) {
      return cb(new ExchangeError('Invalid topic binding pattern'));
    }

    const { keyQueueProperties, keyQueueExchangeBindings } =
      redisKeys.getQueueKeys(queueParams, null);
    const { keyExchange, keyExchangeBindingPatterns } =
      redisKeys.getExchangeTopicKeys(exchangeParams.ns, exchangeParams.name);
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
      withWatchTransaction(
        client,
        (c, watch, done) => {
          let exchangeQueuePolicy: EExchangeQueuePolicy | null = null;

          async.waterfall(
            [
              // WATCH base keys BEFORE any reads
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

              // Validate queue/exchange under WATCH and compute policy
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

              // Check if already bound (under WATCH)
              (_: void, cb1: ICallback<void>) =>
                c.sismember(keyBindingPatternQueues, queueStr, (err, reply) => {
                  if (err) return cb1(err);
                  if (reply === 1) {
                    this.logger.debug('bindQueue: already bound');
                    return cb1(new QueueAlreadyBound());
                  }
                  cb1();
                }),

              // Build MULTI atomically
              (_: void, cb1: ICallback<IWatchTransactionAttemptResult>) => {
                const typeField = String(EExchangeProperty.TYPE);
                const queuePolicyField = String(EExchangeProperty.QUEUE_POLICY);

                const multi = c.multi();

                // Exchange meta
                multi.hset(keyExchange, typeField, EExchangeType.TOPIC);
                multi.hset(
                  keyExchange,
                  queuePolicyField,
                  Number(exchangeQueuePolicy),
                );

                // Indexes
                multi.sadd(keyExchanges, exchangeStr);
                multi.sadd(keyNamespaceExchanges, exchangeStr);

                // Bindings
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
            if (err instanceof QueueAlreadyBound) return outerCb();
            return outerCb(err);
          }
          this.logger.info(
            `bindQueue: bound q=${queueParams.name} ns=${queueParams.ns} -> ex=${exchangeParams.name} ns=${exchangeParams.ns} pat=${routingPattern}`,
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
   * Unbind a queue from a topic exchange binding pattern.
   *
   * This method removes a binding between a queue and an exchange for a specific
   * topic pattern. After unbinding, messages matching the pattern will no longer
   * be routed to the queue.
   *
   * @param queue - Queue name or parameter object.
   * @param exchange - Exchange name or parameter object.
   * @param routingPattern - Topic binding pattern to unbind.
   * @param cb - Callback invoked when the operation completes.
   *
   * @throws QueueNotBoundError via callback if the queue is not bound to the pattern.
   * @throws NamespaceMismatchError When namespace mismatch occurs
   * @throws ExchangeError via callback on invalid binding pattern or exchange type mismatch.
   * @throws ExchangeError via callback on concurrency conflicts.
   *
   * @example
   * ```typescript
   * // Unbind queue from specific pattern
   * topicExchange.unbindQueue(
   *   'order-processor',
   *   'events',
   *   'order.cancelled',
   *   (err) => {
   *     if (err) {
   *       console.error('Failed to unbind queue:', err);
   *       return;
   *     }
   *     console.log('Queue unbound successfully');
   *   }
   * );
   * ```
   */
  unbindQueue(
    queue: string | IQueueParams,
    exchange: string | IExchangeParams,
    routingPattern: string,
    cb: ICallback,
  ): void {
    const queueParams = _parseQueueParams(queue);
    const exchangeParams = _parseExchangeParams(exchange, this.type);

    if (queueParams instanceof Error) return cb(queueParams);
    if (exchangeParams instanceof Error) return cb(exchangeParams);

    if (queueParams.ns !== exchangeParams.ns) {
      return cb(new NamespaceMismatchError());
    }
    if (!_validateTopicExchangeBindingPattern(routingPattern)) {
      return cb(new ExchangeError('Invalid topic binding pattern'));
    }

    const { keyQueueExchangeBindings } = redisKeys.getQueueKeys(
      queueParams,
      null,
    );
    const { keyExchange, keyExchangeBindingPatterns } =
      redisKeys.getExchangeTopicKeys(exchangeParams.ns, exchangeParams.name);
    const { keyBindingPatternQueues } =
      redisKeys.getExchangeTopicBindingPatternKeys(
        exchangeParams.ns,
        exchangeParams.name,
        routingPattern,
      );

    const queueStr = JSON.stringify(queueParams);
    const exchangeStr = JSON.stringify(exchangeParams);

    withSharedPoolConnection((client, outerCb) => {
      withWatchTransaction(
        client,
        (c, watch, done) => {
          let allPatterns: string[] = [];
          let currentPatternCount = 0;
          let stillBoundViaOtherPattern = false;

          async.waterfall(
            [
              // WATCH base keys BEFORE reads
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

              // Validate exchange type under WATCH
              (_: void, cb1: ICallback<void>) =>
                _validateExchange(c, exchangeParams, true, cb1),

              // Ensure this queue is currently bound to the pattern (under WATCH)
              (_: void, cb1: ICallback<void>) =>
                c.sismember(keyBindingPatternQueues, queueStr, (err, reply) => {
                  if (err) return cb1(err);
                  if (reply !== 1) return cb1(new QueueNotBoundError());
                  cb1();
                }),

              // Read all patterns under WATCH
              (_: void, cb1: ICallback<void>) =>
                c.smembers(keyExchangeBindingPatterns, (err, pats) => {
                  if (err) return cb1(err);
                  allPatterns = (pats ?? []).filter((p) => p && p.length);
                  cb1();
                }),

              // WATCH derived keys for other patterns and compute flags
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

                // Extend WATCH set with derived keys
                const doWatch = (next: ICallback<void>) =>
                  otherPatternSets.length
                    ? watch(otherPatternSets, next)
                    : next();

                doWatch((err) => {
                  if (err) return cb1(err);

                  // Compute counts and cross-pattern binding status
                  async.series(
                    [
                      // Count members in current pattern set
                      (cbx: ICallback<void>) =>
                        c.scard(keyBindingPatternQueues, (e, count) => {
                          if (e) return cbx(e);
                          currentPatternCount = count || 0;
                          cbx();
                        }),

                      // Check if queue is bound via any other pattern
                      (cbx: ICallback<void>) => {
                        if (otherPatternSets.length === 0) return cbx();
                        async.eachOf(
                          otherPatternSets,
                          (setKey, _i, next) => {
                            if (stillBoundViaOtherPattern) return next();
                            c.sismember(setKey, queueStr, (e2, rep) => {
                              if (e2) return next(e2);
                              if (rep === 1) stillBoundViaOtherPattern = true;
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

              // Build MULTI to unbind and perform conditional cleanups atomically
              (_: void, cb1: ICallback<IWatchTransactionAttemptResult>) => {
                const multi = c.multi();

                // Always remove the queue from the current pattern set
                multi.srem(keyBindingPatternQueues, queueStr);

                // If this was the last queue for this pattern, remove the pattern from the exchange index
                if (currentPatternCount === 1) {
                  multi.srem(keyExchangeBindingPatterns, routingPattern);
                }

                // If the queue is no longer bound to this exchange via any other pattern, remove reverse index
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
          if (err) return outerCb(err);
          this.logger.info(
            `unbindQueue: unbound q=${queueParams.name} ns=${queueParams.ns} <- ex=${exchangeParams.name} ns=${exchangeParams.ns} pat=${routingPattern}`,
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

  create(
    exchange: string | IExchangeParams,
    queuePolicy: EExchangeQueuePolicy,
    cb: ICallback,
  ) {
    const exchangeParams = _parseExchangeParams(exchange, this.type);
    if (exchangeParams instanceof Error)
      return cb(new InvalidTopicExchangeParamsError());
    withSharedPoolConnection(
      (client, cb) => _saveExchange(client, exchangeParams, queuePolicy, cb),
      cb,
    );
  }

  /**
   * Delete a topic exchange.
   *
   * This method removes a topic exchange and all its associated data structures.
   * The operation is atomic and ensures data consistency across all related Redis keys.
   *
   * @param exchange - Exchange name or parameter object.
   * @param cb - Callback invoked when the exchange is deleted or if an error occurs.
   *
   * @throws ExchangeError via callback if exchange is not found or not a topic exchange.
   * @throws ExchangeHasBoundQueuesError via callback if there are bound queues.
   * @throws ExchangeError via callback on concurrent modifications.
   *
   * @example
   * ```typescript
   * // Delete a topic exchange
   * topicExchange.delete('events', (err) => {
   *   if (err) {
   *     if (err instanceof ExchangeHasBoundQueuesError) {
   *       console.error('Cannot delete exchange: queues are still bound');
   *     } else {
   *       console.error('Failed to delete exchange:', err);
   *     }
   *     return;
   *   }
   *   console.log('Exchange deleted successfully');
   * });
   *
   * // Delete with explicit namespace
   * topicExchange.delete(
   *   { name: 'notifications', ns: 'production' },
   *   (err) => { ... }
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
    const { keyExchange, keyExchangeBindingPatterns } =
      redisKeys.getExchangeTopicKeys(exchangeParams.ns, exchangeParams.name);

    const exchangeStr = JSON.stringify(exchangeParams);

    withSharedPoolConnection((client, outerCb) => {
      withWatchTransaction(
        client,
        (c, watch, done) => {
          let patterns: string[] = [];

          async.waterfall(
            [
              // 1) WATCH base keys BEFORE any reads that inform writes
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

              // 2) Validate exchange type (under WATCH)
              (_: void, cb1: ICallback<void>) =>
                _validateExchange(c, exchangeParams, true, cb1),

              // 3) Read all binding patterns (under WATCH)
              (_: void, cb1: ICallback<void>) =>
                c.smembers(keyExchangeBindingPatterns, (err, pats) => {
                  if (err) return cb1(err);
                  patterns = (pats ?? []).filter((p) => p && p.length);
                  cb1();
                }),

              // 4) WATCH derived keys (per-pattern queues sets) AFTER we know them
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

              // 5) Ensure there are no bound queues for any pattern (reads under WATCH)
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

              // 6) Build MULTI to delete atomically
              (_: void, cb1: ICallback<IWatchTransactionAttemptResult>) => {
                const multi = c.multi();

                // Delete exchange meta and pattern index
                multi.del(keyExchange);
                multi.del(keyExchangeBindingPatterns);

                // Remove from global and namespace indexes
                multi.srem(keyExchanges, exchangeStr);
                multi.srem(keyNamespaceExchanges, exchangeStr);

                // Delete each per-pattern queues set
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
            `delete: exchange "${exchangeParams.name}" (ns=${exchangeParams.ns}) deleted`,
          );
          outerCb();
        },
      );
    }, cb);
  }
}
