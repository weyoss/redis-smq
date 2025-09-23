/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { withSharedPoolConnection } from '../../common/redis-connection-pool/with-shared-pool-connection.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { _getQueueProperties } from '../../queue-manager/_/_get-queue-properties.js';
import { _parseQueueParams } from '../../queue-manager/_/_parse-queue-params.js';
import {
  EQueueProperty,
  IQueueParams,
  IQueueProperties,
} from '../../queue-manager/index.js';
import {
  ExchangeHasBoundQueuesError,
  QueueDeliveryModelMismatchError,
  QueueNotBoundError,
} from '../../errors/index.js';
import { ExchangeAbstract } from '../exchange-abstract.js';
import { _getFanoutExchangeQueues } from './_/_get-fanout-exchange-queues.js';
import { _getQueueFanoutExchange } from './_/_get-queue-fanout-exchange.js';
import { _validateExchangeFanoutParams } from './_/_validate-exchange-fanout-params.js';

/**
 * Fanout Exchange implementation for RedisSMQ.
 *
 * A fanout exchange routes messages to all queues bound to it, regardless of routing keys.
 * This is useful for broadcasting messages to multiple consumers. All bound queues must
 * have the same queue type to ensure compatibility.
 *
 * Key features:
 * - Broadcasts messages to all bound queues
 * - Enforces queue type consistency across bound queues
 * - Supports atomic bind/unbind operations
 * - Prevents deletion when queues are still bound
 *
 * @example
 * ```typescript
 * const fanoutExchange = new ExchangeFanout();
 *
 * // Save the exchange
 * fanoutExchange.saveExchange('notifications', (err) => {
 *   if (err) console.error('Failed to save exchange:', err);
 * });
 *
 * // Bind queues to the exchange
 * fanoutExchange.bindQueue('email-queue', 'notifications', (err) => {
 *   if (err) console.error('Failed to bind queue:', err);
 * });
 *
 * // Get all bound queues
 * fanoutExchange.getQueues('notifications', (err, queues) => {
 *   if (err) console.error('Error:', err);
 *   else console.log('Bound queues:', queues);
 * });
 * ```
 */
export class ExchangeFanout extends ExchangeAbstract<string> {
  /**
   * Creates a new ExchangeFanout instance.
   *
   * Initializes the fanout exchange with logging capabilities.
   */
  constructor() {
    super();
    this.logger.info('ExchangeFanOut initialized');
  }

  /**
   * Retrieves all queues bound to the specified fanout exchange.
   *
   * @param exchangeParams - The name of the fanout exchange
   * @param cb - Callback function that receives the bound queues or an error
   *
   * @example
   * ```typescript
   * const exchange = new ExchangeFanout();
   *
   * exchange.getQueues('notifications', (err, queues) => {
   *   if (err) {
   *     console.error('Failed to get queues:', err);
   *   } else {
   *     console.log('Bound queues:', queues);
   *     // queues = [{ name: 'email-queue', ns: 'default' }, { name: 'sms-queue', ns: 'default' }]
   *   }
   * });
   * ```
   *
   * @throws {InvalidFanoutExchangeParametersError} When the exchange name is invalid
   * @throws {Error} When Redis connection or query operations fail
   */
  getQueues(exchangeParams: string, cb: ICallback<IQueueParams[]>): void {
    this.logger.debug(`Getting queues for exchange: ${exchangeParams}`);

    const fanOutName = _validateExchangeFanoutParams(exchangeParams);
    if (fanOutName instanceof Error) {
      this.logger.error(`Invalid exchange parameters: ${fanOutName.message}`);
      return cb(fanOutName);
    }

    withSharedPoolConnection((client, cb) => {
      this.logger.debug(`Fetching queues bound to exchange: ${fanOutName}`);
      _getFanoutExchangeQueues(client, fanOutName, (err, queues) => {
        if (err) {
          this.logger.error(`Error fetching bound queues: ${err.message}`);
          return cb(err);
        }

        this.logger.info(
          `Found ${queues?.length || 0} queues bound to exchange: ${fanOutName}`,
        );
        if (queues && queues.length > 0) {
          this.logger.debug(`Bound queues: ${JSON.stringify(queues)}`);
        }

        cb(null, queues || []);
      });
    }, cb);
  }

  /**
   * Creates and saves a new fanout exchange.
   *
   * The exchange name must be a valid Redis key. Once saved, queues can be bound to this exchange.
   *
   * @param exchangeParams - The name of the fanout exchange to create
   * @param cb - Callback function that receives an error if the operation fails
   *
   * @example
   * ```typescript
   * const exchange = new ExchangeFanout();
   *
   * exchange.saveExchange('user-notifications', (err) => {
   *   if (err) {
   *     console.error('Failed to save exchange:', err);
   *   } else {
   *     console.log('Exchange saved successfully');
   *   }
   * });
   * ```
   *
   * @throws {InvalidFanoutExchangeParametersError} When the exchange name is invalid
   * @throws {Error} When Redis connection or storage operations fail
   */
  saveExchange(exchangeParams: string, cb: ICallback<void>): void {
    this.logger.debug(`Saving exchange: ${exchangeParams}`);

    const fanOutName = _validateExchangeFanoutParams(exchangeParams);
    if (fanOutName instanceof Error) {
      this.logger.error(`Invalid exchange parameters: ${fanOutName.message}`);
      return cb(fanOutName);
    }

    const { keyFanOutExchanges } = redisKeys.getMainKeys();
    this.logger.debug(`Using Redis key: ${keyFanOutExchanges}`);

    withSharedPoolConnection((client, cb) => {
      this.logger.debug(
        `Adding exchange ${fanOutName} to set ${keyFanOutExchanges}`,
      );
      client.sadd(keyFanOutExchanges, fanOutName, (err) => {
        if (err) {
          this.logger.error(`Failed to save exchange: ${err.message}`);
          return cb(err);
        }

        this.logger.info(`Exchange ${fanOutName} saved successfully`);
        cb();
      });
    }, cb);
  }

  /**
   * Deletes a fanout exchange.
   *
   * The exchange can only be deleted if no queues are currently bound to it.
   * This operation is atomic and uses Redis WATCH/MULTI/EXEC for consistency.
   *
   * @param exchangeParams - The name of the fanout exchange to delete
   * @param cb - Callback function that receives an error if the operation fails
   *
   * @example
   * ```typescript
   * const exchange = new ExchangeFanout();
   *
   * exchange.deleteExchange('old-notifications', (err) => {
   *   if (err) {
   *     if (err instanceof ExchangeHasBoundQueuesError) {
   *       console.error('Cannot delete: exchange has bound queues');
   *     } else {
   *       console.error('Failed to delete exchange:', err);
   *     }
   *   } else {
   *     console.log('Exchange deleted successfully');
   *   }
   * });
   * ```
   *
   * @throws {InvalidFanoutExchangeParametersError} When the exchange name is invalid
   * @throws {ExchangeHasBoundQueuesError} When the exchange still has bound queues
   * @throws {Error} When Redis connection or deletion operations fail
   */
  deleteExchange(exchangeParams: string, cb: ICallback<void>): void {
    this.logger.debug(`Deleting exchange: ${exchangeParams}`);

    const fanOutName = _validateExchangeFanoutParams(exchangeParams);
    if (fanOutName instanceof Error) {
      this.logger.error(`Invalid exchange parameters: ${fanOutName.message}`);
      return cb(fanOutName);
    }

    const { keyFanoutExchangeBindings } =
      redisKeys.getFanOutExchangeKeys(fanOutName);
    const { keyFanOutExchanges } = redisKeys.getMainKeys();

    this.logger.debug(
      `Using Redis keys: ${keyFanOutExchanges}, ${keyFanoutExchangeBindings}`,
    );

    withSharedPoolConnection((client, cb) => {
      this.logger.debug(
        `Watching keys for atomic operation: ${keyFanOutExchanges}, ${keyFanoutExchangeBindings}`,
      );
      client.watch([keyFanOutExchanges, keyFanoutExchangeBindings], (err) => {
        if (err) {
          this.logger.error(`Failed to watch Redis keys: ${err.message}`);
          return cb(err);
        }

        this.logger.debug(
          `Checking if exchange ${fanOutName} has bound queues`,
        );
        _getFanoutExchangeQueues(client, fanOutName, (err, reply = []) => {
          if (err) {
            this.logger.error(`Error checking bound queues: ${err.message}`);
            return cb(err);
          }

          if (reply.length) {
            this.logger.warn(
              `Cannot delete exchange ${fanOutName}: has ${reply.length} bound queues`,
            );
            return cb(new ExchangeHasBoundQueuesError());
          }

          this.logger.debug(
            `Executing multi commands to delete exchange ${fanOutName}`,
          );
          const multi = client.multi();
          multi.srem(keyFanOutExchanges, fanOutName);
          multi.del(keyFanoutExchangeBindings);

          multi.exec((err) => {
            if (err) {
              this.logger.error(
                `Failed to execute delete commands: ${err.message}`,
              );
              return cb(err);
            }

            this.logger.info(`Exchange ${fanOutName} deleted successfully`);
            cb();
          });
        });
      });
    }, cb);
  }

  /**
   * Binds a queue to a fanout exchange.
   *
   * This operation ensures that:
   * - The queue exists and is accessible
   * - All queues bound to the same exchange have the same queue type
   * - The binding is atomic using Redis WATCH/MULTI/EXEC
   * - If the queue was previously bound to another exchange, it's unbound first
   *
   * @param queue - The queue to bind (string name or IQueueParams object)
   * @param exchangeParams - The name of the fanout exchange
   * @param cb - Callback function that receives an error if the operation fails
   *
   * @example
   * ```typescript
   * const exchange = new ExchangeFanout();
   *
   * // Bind using queue name (uses default namespace)
   * exchange.bindQueue('email-queue', 'notifications', (err) => {
   *   if (err) console.error('Failed to bind queue:', err);
   * });
   *
   * // Bind using queue parameters with custom namespace
   * exchange.bindQueue(
   *   { name: 'sms-queue', ns: 'messaging' },
   *   'notifications',
   *   (err) => {
   *     if (err) {
   *       if (err instanceof QueueDeliveryModelMismatchError) {
   *         console.error('Queue type mismatch with existing bound queues');
   *       } else {
   *         console.error('Failed to bind queue:', err);
   *       }
   *     }
   *   }
   * );
   * ```
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid
   * @throws {InvalidFanoutExchangeParametersError} When the exchange name is invalid
   * @throws {QueueNotFoundError} When the specified queue doesn't exist
   * @throws {QueueDeliveryModelMismatchError} When queue type doesn't match existing bound queues
   * @throws {Error} When Redis connection or binding operations fail
   */
  bindQueue(
    queue: IQueueParams | string,
    exchangeParams: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Binding queue ${typeof queue === 'string' ? queue : JSON.stringify(queue)} to exchange: ${exchangeParams}`,
    );

    const queueParams = _parseQueueParams(queue);
    const fanOutName = _validateExchangeFanoutParams(exchangeParams);

    if (queueParams instanceof Error) {
      this.logger.error(`Invalid queue parameters: ${queueParams.message}`);
      return cb(queueParams);
    }

    if (fanOutName instanceof Error) {
      this.logger.error(`Invalid exchange parameters: ${fanOutName.message}`);
      return cb(fanOutName);
    }

    const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams, null);
    const { keyFanoutExchangeBindings } =
      redisKeys.getFanOutExchangeKeys(fanOutName);
    const { keyQueues, keyFanOutExchanges } = redisKeys.getMainKeys();

    this.logger.debug(
      `Using Redis keys: ${keyQueues}, ${keyQueueProperties}, ${keyFanoutExchangeBindings}, ${keyFanOutExchanges}`,
    );

    withSharedPoolConnection((client, cb) => {
      async.waterfall(
        [
          (cb: ICallback<void>) => {
            this.logger.debug(
              `Watching keys for atomic operation: ${keyQueues}, ${keyQueueProperties}, ${keyFanoutExchangeBindings}`,
            );
            client.watch(
              [keyQueues, keyQueueProperties, keyFanoutExchangeBindings],
              (err) => {
                if (err) {
                  this.logger.error(
                    `Failed to watch Redis keys: ${err.message}`,
                  );
                }
                cb(err);
              },
            );
          },
          (_, cb: ICallback<IQueueProperties>) => {
            this.logger.debug(
              `Getting properties for queue: ${queueParams.name}`,
            );
            _getQueueProperties(client, queueParams, (err, properties) => {
              if (err) {
                this.logger.error(
                  `Failed to get queue properties: ${err.message}`,
                );
              }
              cb(err, properties);
            });
          },
          (
            queueProperties: IQueueProperties,
            cb: ICallback<IQueueProperties>,
          ) => {
            this.logger.debug(
              `Checking queue type compatibility for exchange: ${fanOutName}`,
            );
            _getFanoutExchangeQueues(client, fanOutName, (err, queues) => {
              if (err) {
                this.logger.error(
                  `Error checking bound queues: ${err.message}`,
                );
                return cb(err);
              }

              const eQueue = queues?.pop();
              if (eQueue) {
                this.logger.debug(
                  `Found existing queue ${eQueue.name}, checking type compatibility`,
                );
                _getQueueProperties(
                  client,
                  eQueue,
                  (err, exchangeQueueProperties) => {
                    if (err) {
                      this.logger.error(
                        `Failed to get exchange queue properties: ${err.message}`,
                      );
                      return cb(err);
                    }

                    if (!exchangeQueueProperties) {
                      this.logger.error(
                        'Exchange queue properties returned empty',
                      );
                      return cb(new CallbackEmptyReplyError());
                    }

                    if (
                      exchangeQueueProperties.queueType !==
                      queueProperties.queueType
                    ) {
                      this.logger.warn(
                        `Queue type mismatch: ${queueProperties.queueType} vs ${exchangeQueueProperties.queueType}`,
                      );
                      return cb(new QueueDeliveryModelMismatchError());
                    }

                    this.logger.debug('Queue types are compatible');
                    cb(null, queueProperties);
                  },
                );
              } else {
                this.logger.debug(
                  'No existing queues bound to exchange, proceeding with bind',
                );
                cb(null, queueProperties);
              }
            });
          },
          (queueProperties: IQueueProperties, cb: ICallback<void>) => {
            const currentExchangeParams = queueProperties.fanoutExchange;

            if (currentExchangeParams === fanOutName) {
              this.logger.info(
                `Queue ${queueParams.name} is already bound to fanout exchange ${fanOutName}`,
              );
              return cb();
            }

            this.logger.debug(
              `Binding queue ${queueParams.name} to fanout exchange ${fanOutName}`,
            );
            const multi = client.multi();
            const queueParamsStr = JSON.stringify(queueParams);

            multi.sadd(keyFanOutExchanges, fanOutName);
            multi.sadd(keyFanoutExchangeBindings, queueParamsStr);
            multi.hset(
              keyQueueProperties,
              String(EQueueProperty.FANOUT_EXCHANGE),
              fanOutName,
            );

            if (currentExchangeParams) {
              this.logger.debug(
                `Queue was previously bound to fanout exchange ${currentExchangeParams}, removing old binding`,
              );
              const { keyFanoutExchangeBindings } =
                redisKeys.getFanOutExchangeKeys(currentExchangeParams);
              multi.srem(keyFanoutExchangeBindings, queueParamsStr);
            }

            multi.exec((err) => {
              if (err) {
                this.logger.error(
                  `Failed to execute bind commands: ${err.message}`,
                );
              } else {
                this.logger.info(
                  `Queue ${queueParams.name} successfully bound to fanout exchange ${fanOutName}`,
                );
              }
              cb(err);
            });
          },
        ],
        (err) => {
          if (err) {
            this.logger.debug('Error occurred, unwatching Redis keys');
            client.unwatch(() => cb(err));
          } else {
            cb();
          }
        },
      );
    }, cb);
  }

  /**
   * Unbinds a queue from a fanout exchange.
   *
   * This operation verifies that the queue is actually bound to the specified exchange
   * before removing the binding. The operation is atomic using Redis WATCH/MULTI/EXEC.
   *
   * @param queue - The queue to unbind (string name or IQueueParams object)
   * @param exchangeParams - The name of the fanout exchange
   * @param cb - Callback function that receives an error if the operation fails
   *
   * @example
   * ```typescript
   * const exchange = new ExchangeFanout();
   *
   * // Unbind using queue name
   * exchange.unbindQueue('email-queue', 'notifications', (err) => {
   *   if (err) {
   *     if (err instanceof QueueNotBoundError) {
   *       console.error('Queue is not bound to this exchange');
   *     } else {
   *       console.error('Failed to unbind queue:', err);
   *     }
   *   }
   * });
   *
   * // Unbind using queue parameters
   * exchange.unbindQueue(
   *   { name: 'sms-queue', ns: 'messaging' },
   *   'notifications',
   *   (err) => {
   *     if (err) console.error('Failed to unbind queue:', err);
   *   }
   * );
   * ```
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid
   * @throws {InvalidFanoutExchangeParametersError} When the exchange name is invalid
   * @throws {QueueNotFoundError} When the specified queue doesn't exist
   * @throws {QueueNotBoundError} When the queue is not bound to the specified exchange
   * @throws {Error} When Redis connection or unbinding operations fail
   */
  unbindQueue(
    queue: IQueueParams | string,
    exchangeParams: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Unbinding queue ${typeof queue === 'string' ? queue : JSON.stringify(queue)} from exchange: ${exchangeParams}`,
    );

    const queueParams = _parseQueueParams(queue);
    const fanOutName = _validateExchangeFanoutParams(exchangeParams);

    if (queueParams instanceof Error) {
      this.logger.error(`Invalid queue parameters: ${queueParams.message}`);
      return cb(queueParams);
    }

    if (fanOutName instanceof Error) {
      this.logger.error(`Invalid exchange parameters: ${fanOutName.message}`);
      return cb(fanOutName);
    }

    const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams, null);
    const { keyQueues } = redisKeys.getMainKeys();
    const { keyFanoutExchangeBindings } =
      redisKeys.getFanOutExchangeKeys(fanOutName);

    this.logger.debug(
      `Using Redis keys: ${keyQueues}, ${keyQueueProperties}, ${keyFanoutExchangeBindings}`,
    );

    withSharedPoolConnection((client, cb) => {
      async.series(
        [
          (cb: ICallback<void>) => {
            this.logger.debug(
              `Watching keys for atomic operation: ${keyQueues}, ${keyQueueProperties}, ${keyFanoutExchangeBindings}`,
            );
            client.watch(
              [keyQueues, keyQueueProperties, keyFanoutExchangeBindings],
              (err) => {
                if (err) {
                  this.logger.error(
                    `Failed to watch Redis keys: ${err.message}`,
                  );
                }
                cb(err);
              },
            );
          },
          (cb: ICallback<void>) => {
            this.logger.debug(
              `Verifying queue ${queueParams.name} is bound to exchange ${fanOutName}`,
            );
            _getQueueProperties(client, queueParams, (err, properties) => {
              if (err) {
                this.logger.error(
                  `Failed to get queue properties: ${err.message}`,
                );
                return cb(err);
              }

              if (!properties) {
                this.logger.error('Queue properties returned empty');
                return cb(new CallbackEmptyReplyError());
              }

              if (properties.fanoutExchange !== fanOutName) {
                this.logger.warn(
                  `Queue ${queueParams.name} is not bound to exchange ${fanOutName} (bound to: ${properties.fanoutExchange || 'none'})`,
                );
                return cb(new QueueNotBoundError());
              }

              this.logger.debug(
                `Queue ${queueParams.name} is bound to exchange ${fanOutName}, proceeding with unbind`,
              );
              cb();
            });
          },
          (cb: ICallback<void>) => {
            this.logger.debug(
              `Executing unbind commands for queue ${queueParams.name} from exchange ${fanOutName}`,
            );
            const multi = client.multi();
            const queueParamsStr = JSON.stringify(queueParams);

            multi.srem(keyFanoutExchangeBindings, queueParamsStr);
            multi.hdel(
              keyQueueProperties,
              String(EQueueProperty.FANOUT_EXCHANGE),
            );

            multi.exec((err) => {
              if (err) {
                this.logger.error(
                  `Failed to execute unbind commands: ${err.message}`,
                );
              } else {
                this.logger.info(
                  `Queue ${queueParams.name} successfully unbound from exchange ${fanOutName}`,
                );
              }
              cb(err);
            });
          },
        ],
        (err) => {
          if (err) {
            this.logger.debug('Error occurred, unwatching Redis keys');
            client.unwatch(() => cb(err));
          } else {
            cb();
          }
        },
      );
    }, cb);
  }

  /**
   * Retrieves all existing fanout exchanges.
   *
   * @param cb - Callback function that receives the list of exchange names or an error
   *
   * @example
   * ```typescript
   * const exchange = new ExchangeFanout();
   *
   * exchange.getAllExchanges((err, exchanges) => {
   *   if (err) {
   *     console.error('Failed to get exchanges:', err);
   *   } else {
   *     console.log('Available exchanges:', exchanges);
   *     // exchanges = ['notifications', 'user-events', 'system-alerts']
   *   }
   * });
   * ```
   *
   * @throws {Error} When Redis connection or scan operations fail
   */
  getAllExchanges(cb: ICallback<string[]>): void {
    this.logger.debug('Getting all fan-out exchanges');

    const { keyFanOutExchanges } = redisKeys.getMainKeys();
    this.logger.debug(`Using Redis key: ${keyFanOutExchanges}`);

    withSharedPoolConnection((client, cb) => {
      this.logger.debug(
        `Scanning all exchanges from set ${keyFanOutExchanges}`,
      );
      client.sscanAll(keyFanOutExchanges, {}, (err, exchanges) => {
        if (err) {
          this.logger.error(`Failed to scan exchanges: ${err.message}`);
          return cb(err);
        }

        this.logger.info(`Found ${exchanges?.length || 0} fan-out exchanges`);
        if (exchanges && exchanges.length > 0) {
          this.logger.debug(`Exchanges: ${JSON.stringify(exchanges)}`);
        }

        cb(null, exchanges || []);
      });
    }, cb);
  }

  /**
   * Gets the fanout exchange that a queue is bound to.
   *
   * @param queue - The queue to check (string name or IQueueParams object)
   * @param cb - Callback function that receives the exchange name or null if not bound
   *
   * @example
   * ```typescript
   * const exchange = new ExchangeFanout();
   *
   * // Check using queue name
   * exchange.getQueueExchange('email-queue', (err, exchangeName) => {
   *   if (err) {
   *     console.error('Failed to get queue exchange:', err);
   *   } else if (exchangeName) {
   *     console.log(`Queue is bound to exchange: ${exchangeName}`);
   *   } else {
   *     console.log('Queue is not bound to any exchange');
   *   }
   * });
   *
   * // Check using queue parameters
   * exchange.getQueueExchange(
   *   { name: 'sms-queue', ns: 'messaging' },
   *   (err, exchangeName) => {
   *     if (err) console.error('Error:', err);
   *     else console.log('Exchange:', exchangeName || 'none');
   *   }
   * );
   * ```
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid
   * @throws {QueueNotFoundError} When the specified queue doesn't exist
   * @throws {Error} When Redis connection or query operations fail
   */
  getQueueExchange(
    queue: IQueueParams | string,
    cb: ICallback<string | null>,
  ): void {
    this.logger.debug(
      `Getting exchange for queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
    );

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(`Invalid queue parameters: ${queueParams.message}`);
      return cb(queueParams);
    }

    withSharedPoolConnection((client, cb) => {
      this.logger.debug(`Fetching exchange for queue: ${queueParams.name}`);
      _getQueueFanoutExchange(client, queueParams, (err, exchange) => {
        if (err) {
          this.logger.error(`Error fetching queue exchange: ${err.message}`);
          return cb(err);
        }

        if (exchange) {
          this.logger.info(
            `Queue ${queueParams.name} is bound to exchange: ${exchange}`,
          );
        } else {
          this.logger.info(
            `Queue ${queueParams.name} is not bound to any exchange`,
          );
        }

        cb(null, exchange);
      });
    }, cb);
  }
}
