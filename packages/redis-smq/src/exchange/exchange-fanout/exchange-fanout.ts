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
import { Configuration } from '../../config-manager/configuration.js';
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
 * Fanout exchange for broadcasting messages to all bound queues.
 *
 * Routes messages to all queues bound to the exchange, ignoring routing keys.
 * Ideal for pub/sub patterns where every consumer should receive the message.
 *
 * @example
 * const fanoutExchange = new ExchangeFanout();
 *
 * // Bind a queue
 * await fanoutExchange.bindQueue('notifications', 'broadcast');
 *
 * // Match all bound queues
 * const queues = await fanoutExchange.matchQueues('broadcast');
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
   * Gets all queues bound to a fanout exchange (for message production).
   *
   * @param exchange - Exchange name (string) or { name, ns }
   * @param cb - (err, queues) => void. Returns IQueueParams[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const queues = await fanoutExchange.matchQueues('broadcast');
   *
   * // Callback
   * fanoutExchange.matchQueues('broadcast', (err, queues) => {
   *   if (err) throw err;
   *   console.log(queues);
   * });
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
   * @param exchange - Exchange name (string) or { name, ns }
   * @param queuePolicy - STANDARD or PRIORITY
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await fanoutExchange.create('broadcast', EExchangeQueuePolicy.STANDARD);
   *
   * // Callback
   * fanoutExchange.create('broadcast', EExchangeQueuePolicy.STANDARD, (err) => {
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
        return callback(new InvalidFanoutExchangeParametersError());
      withSharedPoolConnection(
        (client, cb) => _saveExchange(client, exchangeParams, queuePolicy, cb),
        callback,
      );
    });
  }

  /**
   * Deletes a fanout exchange.
   *
   * @param exchange - Exchange name (string) or { name, ns }
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await fanoutExchange.delete('old-broadcast');
   *
   * // Callback
   * fanoutExchange.delete('old-broadcast', (err) => {
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
      const { keyFanoutQueues } = redisKeys.getExchangeFanoutKeys(
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
   * @param queue - Queue name (string) or { name, ns }
   * @param exchange - Exchange name (string) or { name, ns }
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await fanoutExchange.bindQueue('notifications', 'broadcast');
   *
   * // Callback
   * fanoutExchange.bindQueue('notifications', 'broadcast', (err) => {
   *   if (err) throw err;
   * });
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
      const { keyExchange } = redisKeys.getExchangeKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );
      const { keyFanoutQueues } = redisKeys.getExchangeFanoutKeys(
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
   * @param queue - Queue name (string) or { name, ns }
   * @param exchange - Exchange name (string) or { name, ns }
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await fanoutExchange.unbindQueue('notifications', 'broadcast');
   *
   * // Callback
   * fanoutExchange.unbindQueue('notifications', 'broadcast', (err) => {
   *   if (err) throw err;
   * });
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
      const { keyExchange } = redisKeys.getExchangeKeys(
        exchangeParams.ns,
        exchangeParams.name,
      );
      const { keyFanoutQueues } = redisKeys.getExchangeFanoutKeys(
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
   * Gets all bound queues for a fanout exchange.
   *
   * @param exchange - Exchange name (string) or { name, ns }
   * @param cb - (err, queues) => void. Returns IQueueParams[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const queues = await fanoutExchange.getBindings('broadcast');
   *
   * // Callback
   * fanoutExchange.getBindings('broadcast', (err, queues) => {
   *   if (err) throw err;
   *   console.log(queues);
   * });
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
