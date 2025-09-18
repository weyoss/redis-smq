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
  ICallback,
  withRedisClient,
} from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { _getQueueProperties } from '../../queue-manager/_/_get-queue-properties.js';
import { _parseQueueParams } from '../../queue-manager/_/_parse-queue-params.js';
import {
  EQueueProperty,
  IQueueParams,
  IQueueProperties,
} from '../../queue-manager/index.js';
import {
  ExchangeFanOutExchangeHasBoundQueuesError,
  ExchangeFanOutQueueTypeError,
  ExchangeQueueIsNotBoundToExchangeError,
} from '../index.js';
import { ExchangeAbstract } from '../exchange-abstract.js';
import { _getFanOutExchangeQueues } from './_/_get-fan-out-exchange-queues.js';
import { _getQueueFanOutExchange } from './_/_get-queue-fan-out-exchange.js';
import { _validateExchangeFanOutParams } from './_/_validate-exchange-fan-out-params.js';

/**
 * ExchangeFanOut implements the fan-out exchange pattern where messages
 * published to the exchange are routed to all queues bound to it.
 */
export class ExchangeFanOut extends ExchangeAbstract<string> {
  constructor() {
    super();
    this.logger.info('ExchangeFanOut initialized');
  }

  /**
   * Retrieves all queues bound to a fan-out exchange.
   *
   * @param exchangeParams - The name of the fan-out exchange
   * @param cb - Callback function that receives the list of bound queues
   */
  getQueues(exchangeParams: string, cb: ICallback<IQueueParams[]>): void {
    this.logger.debug(`Getting queues for exchange: ${exchangeParams}`);

    const fanOutName = _validateExchangeFanOutParams(exchangeParams);
    if (fanOutName instanceof Error) {
      this.logger.error(`Invalid exchange parameters: ${fanOutName.message}`);
      return cb(fanOutName);
    }

    withRedisClient(
      this.redisClient,
      (client, cb) => {
        this.logger.debug(`Fetching queues bound to exchange: ${fanOutName}`);
        _getFanOutExchangeQueues(client, fanOutName, (err, queues) => {
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
      },
      cb,
    );
  }

  /**
   * Saves a fan-out exchange to Redis.
   *
   * @param exchangeParams - The name of the fan-out exchange
   * @param cb - Callback function called when the operation completes
   */
  saveExchange(exchangeParams: string, cb: ICallback<void>): void {
    this.logger.debug(`Saving exchange: ${exchangeParams}`);

    const fanOutName = _validateExchangeFanOutParams(exchangeParams);
    if (fanOutName instanceof Error) {
      this.logger.error(`Invalid exchange parameters: ${fanOutName.message}`);
      return cb(fanOutName);
    }

    const { keyFanOutExchanges } = redisKeys.getMainKeys();
    this.logger.debug(`Using Redis key: ${keyFanOutExchanges}`);

    withRedisClient(
      this.redisClient,
      (client, cb) => {
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
      },
      cb,
    );
  }

  /**
   * Deletes a fan-out exchange from Redis.
   *
   * @param exchangeParams - The name of the fan-out exchange
   * @param cb - Callback function called when the operation completes
   */
  deleteExchange(exchangeParams: string, cb: ICallback<void>): void {
    this.logger.debug(`Deleting exchange: ${exchangeParams}`);

    const fanOutName = _validateExchangeFanOutParams(exchangeParams);
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

    withRedisClient(
      this.redisClient,
      (client, cb) => {
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
          _getFanOutExchangeQueues(client, fanOutName, (err, reply = []) => {
            if (err) {
              this.logger.error(`Error checking bound queues: ${err.message}`);
              return cb(err);
            }

            if (reply.length) {
              this.logger.warn(
                `Cannot delete exchange ${fanOutName}: has ${reply.length} bound queues`,
              );
              return cb(new ExchangeFanOutExchangeHasBoundQueuesError());
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
      },
      cb,
    );
  }

  /**
   * Binds a queue-manager to a fan-out exchange.
   *
   * @param queue - The queue-manager to bind
   * @param exchangeParams - The name of the fan-out exchange
   * @param cb - Callback function called when the operation completes
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
    const fanOutName = _validateExchangeFanOutParams(exchangeParams);

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

    withRedisClient(
      this.redisClient,
      (client, cb) => {
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
              _getFanOutExchangeQueues(client, fanOutName, (err, queues) => {
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
                          'Exchange queue-manager properties returned empty',
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
                        return cb(new ExchangeFanOutQueueTypeError());
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
      },
      cb,
    );
  }

  /**
   * Unbinds a queue-manager from a fan-out exchange.
   *
   * @param queue - The queue-manager to unbind
   * @param exchangeParams - The name of the fan-out exchange
   * @param cb - Callback function called when the operation completes
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
    const fanOutName = _validateExchangeFanOutParams(exchangeParams);

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

    withRedisClient(
      this.redisClient,
      (client, cb) => {
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
                  return cb(new ExchangeQueueIsNotBoundToExchangeError());
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
      },
      cb,
    );
  }

  /**
   * Retrieves all fan-out exchanges.
   *
   * @param cb - Callback function that receives the list of exchanges
   */
  getAllExchanges(cb: ICallback<string[]>): void {
    this.logger.debug('Getting all fan-out exchanges');

    const { keyFanOutExchanges } = redisKeys.getMainKeys();
    this.logger.debug(`Using Redis key: ${keyFanOutExchanges}`);

    withRedisClient(
      this.redisClient,
      (client, cb) => {
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
      },
      cb,
    );
  }

  /**
   * Retrieves the fan-out exchange a queue-manager is bound to.
   *
   * @param queue - The queue-manager to check
   * @param cb - Callback function that receives the exchange name or null
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

    withRedisClient(
      this.redisClient,
      (client, cb) => {
        this.logger.debug(`Fetching exchange for queue: ${queueParams.name}`);
        _getQueueFanOutExchange(client, queueParams, (err, exchange) => {
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
      },
      cb,
    );
  }
}
