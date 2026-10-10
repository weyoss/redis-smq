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
  IRedisClient,
} from 'redis-smq-common';
import { keys } from '../common/redis/keys/keys.js';
import { Configuration } from '../config-manager/configuration.js';
import { _deleteQueue } from '../queue-manager/_/_delete-queue.js';
import { _deleteExchange } from '../exchange/_/_delete-exchange.js';
import { _unbindQueue } from '../exchange/_/_unbind-queue.js';
import { getStrategy } from '../exchange/strategies/registry.js';
import {
  ExchangeNotFoundError,
  InvalidNamespaceError,
  NamespaceNotFoundError,
  QueueNotBoundError,
  QueueNotFoundError,
} from '../errors/index.js';
import { withShared } from '../common/redis/connection-pool/with-shared.js';
import { _getNamespaceQueues } from './_/_get-namespace-queues.js';
import { validateRedisKey } from '../common/redis/keys/validator.js';
import {
  INamespaceManager,
  IExchangeParsedParams,
  IQueueParams,
} from '../../contracts/index.js';

/**
 * Manages message queue namespaces.
 *
 * Provides methods to get namespaces, retrieve queues in a namespace,
 * and delete namespaces with all their queues and exchanges.
 *
 * @example
 * const namespaceManager = RedisSMQ.createNamespaceManager();
 *
 * // Get all namespaces
 * const namespaces = await namespaceManager.getNamespaces();
 *
 * // Get queues in a namespace
 * const queues = await namespaceManager.getNamespaceQueues('production');
 */
export class NamespaceManager implements INamespaceManager {
  protected logger;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name.toLowerCase(),
    );
  }

  /**
   * Gets all namespaces.
   *
   * @param cb - (err, namespaces) => void. Returns string[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const namespaces = await namespaceManager.getNamespaces();
   * console.log(namespaces);
   *
   * // Callback
   * namespaceManager.getNamespaces((err, namespaces) => {
   *   if (err) throw err;
   *   console.log(namespaces);
   * });
   */
  getNamespaces(): Promise<string[]>;
  getNamespaces(cb: ICallback<string[]>): void;
  getNamespaces(cb?: ICallback<string[]>): Promise<string[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Getting all namespaces');
      withShared((client, cb) => {
        const { keyNamespaces } = keys.getMainKeys();
        this.logger.debug('Fetching namespaces from Redis', {
          key: keyNamespaces,
        });
        client.smembers(keyNamespaces, (err, reply) => {
          if (err) {
            this.logger.error('Failed to get namespaces', {
              error: err.message,
            });
            return cb(err);
          }
          if (!reply) {
            this.logger.error('Empty namespaces reply');
            return cb(new CallbackEmptyReplyError());
          }
          this.logger.debug('Successfully retrieved namespaces', {
            count: reply.length,
          });
          cb(null, reply);
        });
      }, callback);
    });
  }

  /**
   * Gets all queues in a namespace.
   *
   * @param namespace - Namespace name
   * @param cb - (err, queues) => void. Returns IQueueParams[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const queues = await namespaceManager.getNamespaceQueues('production');
   * queues.forEach(q => console.log(q.name));
   *
   * // Callback
   * namespaceManager.getNamespaceQueues('production', (err, queues) => {
   *   if (err) throw err;
   *   console.log(queues);
   * });
   */
  getNamespaceQueues(namespace: string): Promise<IQueueParams[]>;
  getNamespaceQueues(namespace: string, cb: ICallback<IQueueParams[]>): void;
  getNamespaceQueues(
    namespace: string,
    cb?: ICallback<IQueueParams[]>,
  ): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Getting queues for namespace', { namespace });
      const ns = validateRedisKey(namespace);
      if (ns instanceof Error) {
        this.logger.error('Invalid namespace', { namespace });
        return callback(new InvalidNamespaceError());
      }
      withShared((client, cb) => {
        const { keyNamespaces } = keys.getMainKeys();
        const { keyNamespaceQueues } = keys.getNamespaceKeys(ns);
        this.logger.debug('Checking if namespace exists', {
          namespace: ns,
          key: keyNamespaces,
        });

        // `series`: each task is `(cb) => void`, runs sequentially, and
        // the final callback receives an array of results. Neither task
        // consumes the other's result, so `waterfall` (whose value is
        // chaining) would be a mismatch.
        async.series(
          [
            (next: ICallback<void>) => {
              client.sismember(keyNamespaces, ns, (err, reply) => {
                if (err) {
                  this.logger.error('Failed to check namespace existence', {
                    namespace: ns,
                    error: err.message,
                  });
                  return next(err);
                }
                if (!reply) {
                  this.logger.error('Namespace not found', {
                    namespace: ns,
                  });
                  return next(new NamespaceNotFoundError());
                }
                this.logger.debug('Namespace exists', { namespace: ns });
                next();
              });
            },
            (next: ICallback<void>) => {
              this.logger.debug('Fetching queues for namespace', {
                namespace: ns,
                key: keyNamespaceQueues,
              });
              client.smembers(keyNamespaceQueues, (err, reply) => {
                if (err) {
                  this.logger.error('Failed to get namespace queues', {
                    namespace: ns,
                    error: err.message,
                  });
                  return next(err);
                }
                if (!reply) {
                  this.logger.error('Empty queues reply', { namespace: ns });
                  return next(new CallbackEmptyReplyError());
                }
                next();
              });
            },
          ],
          (err) => {
            if (err) return cb(err);
            // The existence check has already confirmed the namespace is
            // present, so the queue list is the second read's result.
            client.smembers(keyNamespaceQueues, (err, reply) => {
              if (err) return cb(err);
              const messageQueues: IQueueParams[] = (reply ?? []).map((i) =>
                JSON.parse(i),
              );
              this.logger.debug('Successfully retrieved namespace queues', {
                namespace: ns,
                queueCount: messageQueues.length,
              });
              cb(null, messageQueues);
            });
          },
        );
      }, callback);
    });
  }

  /**
   * Deletes a namespace and everything in it.
   *
   * The operation removes, in order:
   *
   *   1. Every binding between the namespace's queues and its exchanges.
   *      Required because `delete-queue` refuses while a queue has any
   *      bound exchanges, and `delete-exchange` refuses while an exchange
   *      has any bound queues — neither side can be removed while a
   *      binding exists.
   *   2. Every queue in the namespace, using the same path as
   *      `QueueManager.delete()`. A queue that has pending messages,
   *      active consumers, or is LOCKED causes its own deletion to fail
   *      with the corresponding error.
   *   3. Every exchange in the namespace.
   *   4. The namespace itself from the global namespace registry.
   *
   * **Not atomic across the namespace.** If any step fails partway
   * through, the namespace is left partially deleted. Queues, exchanges,
   * and bindings removed before the failure remain removed. The caller
   * should inspect the error, fix the cause, and retry — the operation
   * re-enters at step 1 and skips resources that are already gone.
   *
   * **Concurrent deletion is tolerated.** If a queue, an exchange, or a
   * binding has already disappeared by the time the operation reaches
   * it — removed by another caller running `delete()` on the same
   * namespace — the absence is treated as success for that resource.
   * This mirrors the tolerance the previous implementation had for
   * `QueueNotFoundError` and extends it to the exchange side.
   *
   * @param namespace - Namespace name
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await namespaceManager.delete('staging');
   *
   * // Callback
   * namespaceManager.delete('staging', (err) => {
   *   if (err) throw err;
   * });
   */
  delete(namespace: string): Promise<void>;
  delete(namespace: string, cb: ICallback<void>): void;
  delete(namespace: string, cb?: ICallback<void>): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug('Deleting namespace', { namespace });
      const ns = validateRedisKey(namespace);
      if (ns instanceof Error) {
        this.logger.error('Invalid namespace', { namespace });
        return callback(new InvalidNamespaceError());
      }

      withShared((client, cb) => {
        const { keyNamespaces } = keys.getMainKeys();
        const { keyNamespaceExchanges } = keys.getNamespaceKeys(ns);

        // State accumulated across steps. Declared here rather than
        // threaded through a waterfall's value channel: neither list is
        // transformed by later steps, and passing them forward would
        // force every intermediate callback to re-emit state it does not
        // touch. With `series`, each task is `(cb) => void` and simply
        // reads and writes the outer bindings.
        let queues: IQueueParams[] = [];
        let exchanges: IExchangeParsedParams[] = [];

        async.series(
          [
            // 1. The namespace must exist. Distinguishes "never had any
            //    queues" from "no such namespace" at the top of the
            //    operation, before any destructive work begins.
            (next: ICallback<void>) => {
              client.sismember(keyNamespaces, ns, (err, isMember) => {
                if (err) {
                  this.logger.error('Failed to check namespace existence', {
                    namespace: ns,
                    error: err.message,
                  });
                  return next(err);
                }
                if (!isMember) {
                  this.logger.error('Namespace not found for deletion', {
                    namespace: ns,
                  });
                  return next(new NamespaceNotFoundError());
                }
                this.logger.debug(
                  'Namespace exists, proceeding with deletion',
                  { namespace: ns },
                );
                next();
              });
            },

            // 2. Enumerate the namespace's queues and exchanges in
            //    parallel. The two reads are independent Redis calls;
            //    running them concurrently halves the wall-clock time
            //    before the destructive steps begin. `parallel` takes an
            //    array of operations and resolves with a tuple in the
            //    same order.
            (next: ICallback<void>) => {
              async.parallel(
                [
                  (cb: ICallback<IQueueParams[]>) =>
                    _getNamespaceQueues(client, ns, cb),
                  (cb: ICallback<IExchangeParsedParams[]>) => {
                    client.smembers(keyNamespaceExchanges, (err, reply) => {
                      if (err) {
                        this.logger.error('Failed to get namespace exchanges', {
                          namespace: ns,
                          error: err.message,
                        });
                        return cb(err);
                      }
                      try {
                        const list = (reply ?? []).map(
                          (s): IExchangeParsedParams => JSON.parse(s),
                        );
                        cb(null, list);
                      } catch (parseErr: unknown) {
                        cb(
                          parseErr instanceof Error
                            ? parseErr
                            : new Error(String(parseErr)),
                        );
                      }
                    });
                  },
                ],
                (err, result) => {
                  if (err) {
                    this.logger.error(
                      'Failed to enumerate namespace contents',
                      {
                        namespace: ns,
                        error: err.message,
                      },
                    );
                    return next(err);
                  }
                  if (!result) return next(new CallbackEmptyReplyError());
                  queues = result[0];
                  exchanges = result[1];
                  this.logger.debug(
                    'Enumerated namespace contents for deletion',
                    {
                      namespace: ns,
                      queueCount: queues.length,
                      exchangeCount: exchanges.length,
                    },
                  );
                  next();
                },
              );
            },

            // 3. Unbind every queue from every exchange in the namespace.
            //
            //    `async.eachOf` iterates one item at a time (it defers
            //    each step through `setTimeout` to bound the call stack),
            //    so the outer and inner loops here are both sequential.
            //    That is intentional: unbind is a transactionally-guarded
            //    Redis operation, and running many of them concurrently
            //    would multiply WATCH-retry contention for no benefit.
            //
            //    Tolerates QueueNotBoundError, ExchangeNotFoundError, and
            //    QueueNotFoundError: a concurrent delete that has already
            //    run partway through this namespace may have removed one
            //    side of a binding (or the queue or exchange itself)
            //    between the enumeration in step 2 and the unbind here.
            //    The absence of a binding is the goal state, not an error.
            (next: ICallback<void>) => {
              if (exchanges.length === 0 || queues.length === 0) return next();

              this.logger.debug(
                'Unbinding queues from exchanges before deletion',
                {
                  namespace: ns,
                  exchangeCount: exchanges.length,
                },
              );

              async.eachOf(
                exchanges,
                (exchange, _i, exchangeDone) => {
                  this.enumerateBindings(client, exchange, (err, pairs) => {
                    if (err) {
                      if (err instanceof ExchangeNotFoundError) {
                        return exchangeDone();
                      }
                      return exchangeDone(err);
                    }

                    async.eachOf(
                      pairs ?? [],
                      (pair, _j, pairDone) => {
                        _unbindQueue(
                          client,
                          pair.queue,
                          exchange,
                          pair.binding,
                          this.logger,
                          (unbindErr) => {
                            if (
                              unbindErr instanceof QueueNotBoundError ||
                              unbindErr instanceof QueueNotFoundError ||
                              unbindErr instanceof ExchangeNotFoundError
                            ) {
                              return pairDone();
                            }
                            pairDone(unbindErr);
                          },
                        );
                      },
                      exchangeDone,
                    );
                  });
                },
                next,
              );
            },

            // 4. Delete each queue. With bindings removed, the
            //    `delete-queue` script's precondition (empty exchange-
            //    bindings set) is satisfied. Other preconditions —
            //    no pending messages, no active consumers, not LOCKED —
            //    still apply and surface as their own errors.
            (next: ICallback<void>) => {
              if (queues.length === 0) return next();

              this.logger.debug('Deleting namespace queues', {
                namespace: ns,
                queueCount: queues.length,
              });

              async.eachOf(
                queues,
                (queueParams, _i, done) => {
                  _deleteQueue(client, queueParams, (err) => {
                    if (err instanceof QueueNotFoundError) return done();
                    if (err) {
                      this.logger.error('Failed to delete queue', {
                        namespace: ns,
                        queue: queueParams.name,
                        error: err,
                      });
                      return done(err);
                    }
                    done();
                  });
                },
                next,
              );
            },

            // 5. Delete each exchange. With the bindings removed and the
            //    queues gone, `delete-exchange`'s precondition (no bound
            //    queues) is satisfied. `_deleteExchange` also removes the
            //    exchange from both the global and namespace exchange
            //    registries as part of its MULTI.
            (next: ICallback<void>) => {
              if (exchanges.length === 0) return next();

              this.logger.debug('Deleting namespace exchanges', {
                namespace: ns,
                exchangeCount: exchanges.length,
              });

              async.eachOf(
                exchanges,
                (exchangeParams, _i, done) => {
                  _deleteExchange(
                    client,
                    exchangeParams,
                    this.logger,
                    (err) => {
                      if (err instanceof ExchangeNotFoundError) return done();
                      if (err) {
                        this.logger.error('Failed to delete exchange', {
                          namespace: ns,
                          exchange: exchangeParams.name,
                          error: err,
                        });
                        return done(err);
                      }
                      done();
                    },
                  );
                },
                next,
              );
            },

            // 6. Remove the namespace from the global registry. Runs
            //    last so a partial failure leaves the registry entry in
            //    place and a retry re-enters from step 1.
            (next: ICallback<void>) => {
              client.srem(keyNamespaces, ns, (err) => {
                if (err) {
                  this.logger.error(
                    'Failed to remove namespace from registry',
                    {
                      namespace: ns,
                      error: err.message,
                    },
                  );
                  return next(err);
                }
                this.logger.debug('Successfully deleted namespace', {
                  namespace: ns,
                });
                next();
              });
            },
          ],
          (err) => cb(err),
        );
      }, callback);
    });
  }

  /**
   * Enumerate every binding between an exchange and a queue, as a flat
   * list of `{ queue, binding }` pairs.
   *
   * Dispatches on the exchange's type via the strategy registry:
   *
   *   - DIRECT: read `keyExchangeRoutingKeys`, then for each routing key
   *     read the queues in `keyRoutingKeyQueues`.
   *   - TOPIC: read `keyExchangeBindingPatterns`, then for each pattern
   *     read the queues in `keyBindingPatternQueues`.
   *   - FANOUT: read the exchange's single queue set directly. Fanout
   *     exchanges have no binding dimension, so every queue is reported
   *     with `binding: null`.
   *
   * The exchange's type comes from the caller — `keyNamespaceExchanges`
   * stores serialized `IExchangeParsedParams`, so no additional Redis
   * read is needed to obtain it.
   */
  protected enumerateBindings(
    client: IRedisClient,
    exchange: IExchangeParsedParams,
    cb: ICallback<{ queue: IQueueParams; binding: string | null }[]>,
  ): void {
    const strategy = getStrategy(exchange.type);
    const bindingsListKey = strategy.getBindingsListKey(
      exchange.ns,
      exchange.name,
    );

    if (!bindingsListKey) {
      // Fanout: single queue set, no binding dimension.
      const fanoutKey = strategy.getBindingQueuesKey(
        exchange.ns,
        exchange.name,
      );
      client.smembers(fanoutKey, (err, members) => {
        if (err) return cb(err);
        try {
          const queues: IQueueParams[] = (members ?? []).map((s) =>
            JSON.parse(s),
          );
          cb(
            null,
            queues.map((q) => ({ queue: q, binding: null })),
          );
        } catch (parseErr: unknown) {
          cb(
            parseErr instanceof Error ? parseErr : new Error(String(parseErr)),
          );
        }
      });
      return;
    }

    client.smembers(bindingsListKey, (err, bindings) => {
      if (err) return cb(err);

      const list = (bindings ?? []).filter(
        (b): b is string => typeof b === 'string' && b.length > 0,
      );

      if (list.length === 0) return cb(null, []);

      const pairs: { queue: IQueueParams; binding: string | null }[] = [];

      async.eachOf(
        list,
        (binding, _i, done) => {
          const queueSetKey = strategy.getBindingQueuesKey(
            exchange.ns,
            exchange.name,
            binding,
          );
          client.smembers(queueSetKey, (queueErr, queues) => {
            if (queueErr) return done(queueErr);
            try {
              for (const q of queues ?? []) {
                pairs.push({ queue: JSON.parse(q), binding });
              }
            } catch (parseErr: unknown) {
              return done(
                parseErr instanceof Error
                  ? parseErr
                  : new Error(String(parseErr)),
              );
            }
            done();
          });
        },
        (eachErr) => cb(eachErr || null, pairs),
      );
    });
  }
}
