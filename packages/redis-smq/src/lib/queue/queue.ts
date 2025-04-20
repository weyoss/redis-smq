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
  logger,
} from 'redis-smq-common';
import { RedisClient } from '../../common/redis-client/redis-client.js';
import { ELuaScriptName } from '../../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../config/index.js';
import { EventBus } from '../event-bus/index.js';
import { _deleteQueue } from './_/_delete-queue.js';
import { _getQueueConsumerIds } from './_/_get-queue-consumer-ids.js';
import { _getQueueConsumers } from './_/_get-queue-consumers.js';
import { _getQueueProperties } from './_/_get-queue-properties.js';
import { _getQueues } from './_/_get-queues.js';
import { _parseQueueParams } from './_/_parse-queue-params.js';
import { _queueExists } from './_/_queue-exists.js';
import { QueueQueueExistsError } from './errors/index.js';
import {
  EQueueDeliveryModel,
  EQueueProperty,
  EQueueType,
  IQueueParams,
  IQueueProperties,
  TQueueConsumer,
} from './types/index.js';

/**
 * The Queue class represents an interface that interacts with Redis for storing
 * and managing queues.
 * It provides functionality to create, check existence, delete, retrieve
 * properties of queues, and manage shutdown operations.
 */
export class Queue {
  protected redisClient;
  protected eventBus;
  protected logger;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.logger.debug('Initializing Queue instance');

    this.eventBus = new EventBus();
    this.eventBus.on('error', (err) => {
      this.logger.error(`EventBus error: ${err.message}`, err);
    });
    this.logger.debug('EventBus initialized');

    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => {
      this.logger.error(`Redis client error: ${err.message}`, err);
    });
    this.logger.debug('Redis client initialized');

    this.logger.info('Queue instance initialized successfully');
  }

  /**
   * Save a new queue with specified parameters.
   * Upon success the callback function is invoked with the created queue details.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/enums/EQueueType.md
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/enums/EQueueDeliveryModel.md
   * @param queue - The name or parameters for the queue.
   * @param queueType - The type of the queue, defined by EQueueType.
   * @param deliveryModel - The model for message delivery, defined by EQueueDeliveryModel.
   * @param cb - Callback function to handle success or error.
   */
  save(
    queue: string | IQueueParams,
    queueType: EQueueType,
    deliveryModel: EQueueDeliveryModel,
    cb: ICallback<{ queue: IQueueParams; properties: IQueueProperties }>,
  ): void {
    const queueDesc =
      typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
    this.logger.debug(
      `Saving queue: ${queueDesc}, type: ${EQueueType[queueType]}, delivery model: ${EQueueDeliveryModel[deliveryModel]}`,
    );

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
        queueParams,
      );
      return cb(queueParams);
    }

    const queueName = `${queueParams.name}@${queueParams.ns}`;
    this.logger.debug(`Parsed queue parameters: ${queueName}`);

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Error getting Redis client for saving queue ${queueName}: ${err.message}`,
          err,
        );
        return cb(err);
      }
      if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client is empty for saving queue ${queueName}`,
          error,
        );
        return cb(error);
      }

      const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams, null);
      const { keyNamespaces, keyQueues } = redisKeys.getMainKeys();
      const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(queueParams.ns);
      const queueParamsStr = JSON.stringify(queueParams);

      this.logger.debug(
        `Executing CREATE_QUEUE script for ${queueName} with keys: [${keyNamespaces}, ${keyNamespaceQueues}, ${keyQueues}, ${keyQueueProperties}]`,
      );

      client.runScript(
        ELuaScriptName.CREATE_QUEUE,
        [keyNamespaces, keyNamespaceQueues, keyQueues, keyQueueProperties],
        [
          queueParams.ns,
          queueParamsStr,
          EQueueProperty.QUEUE_TYPE,
          queueType,
          EQueueProperty.DELIVERY_MODEL,
          deliveryModel,
        ],
        (err, reply) => {
          if (err) {
            this.logger.error(
              `Error executing CREATE_QUEUE script for ${queueName}: ${err.message}`,
              err,
            );
            return cb(err);
          }
          if (!reply) {
            const error = new CallbackEmptyReplyError();
            this.logger.error(
              `Empty reply from CREATE_QUEUE script for ${queueName}`,
              error,
            );
            return cb(error);
          }
          if (reply !== 'OK') {
            const error = new QueueQueueExistsError();
            this.logger.error(`Queue ${queueName} already exists`, error);
            return cb(error);
          }

          this.logger.debug(
            `Queue ${queueName} created successfully, retrieving properties`,
          );

          this.getProperties(queueParams, (err, properties) => {
            if (err) {
              this.logger.error(
                `Error getting properties for newly created queue ${queueName}: ${err.message}`,
                err,
              );
              return cb(err);
            }
            if (!properties) {
              const error = new CallbackEmptyReplyError();
              this.logger.error(
                `Empty properties for newly created queue ${queueName}`,
                error,
              );
              return cb(error);
            }

            this.logger.debug(
              `Retrieved properties for queue ${queueName}, emitting queue.queueCreated event`,
            );

            this.eventBus.getSetInstance((err, instance) => {
              if (err) {
                this.logger.error(
                  `Error getting EventBus instance for queue ${queueName}: ${err.message}`,
                  err,
                );
                return cb(err);
              }

              if (instance) {
                this.logger.debug(
                  `Emitting queue.queueCreated event for ${queueName}`,
                );
                instance.emit('queue.queueCreated', queueParams, properties);
              }

              this.logger.info(
                `Queue ${queueName} successfully created with type=${EQueueType[queueType]}, deliveryModel=${EQueueDeliveryModel[deliveryModel]}`,
              );
              cb(null, { queue: queueParams, properties });
            });
          });
        },
      );
    });
  }

  /**
   * Checks if a specified queue exists.
   *
   * @param queue - The name or parameters for the queue.
   * @param cb - Callback function to return a boolean indicating the existence of the queue.
   */
  exists(queue: string | IQueueParams, cb: ICallback<boolean>): void {
    const queueDesc =
      typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
    this.logger.debug(`Checking if queue exists: ${queueDesc}`);

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
        queueParams,
      );
      cb(queueParams);
    } else {
      const queueName = `${queueParams.name}@${queueParams.ns}`;
      this.logger.debug(`Parsed queue parameters: ${queueName}`);

      this.redisClient.getSetInstance((err, client) => {
        if (err) {
          this.logger.error(
            `Error getting Redis client for checking queue ${queueName}: ${err.message}`,
            err,
          );
          cb(err);
        } else if (!client) {
          const error = new CallbackEmptyReplyError();
          this.logger.error(
            `Redis client is empty for checking queue ${queueName}`,
            error,
          );
          cb(error);
        } else {
          this.logger.debug(`Checking if queue ${queueName} exists in Redis`);
          _queueExists(client, queueParams, (err, exists) => {
            if (err) {
              this.logger.error(
                `Error checking if queue ${queueName} exists: ${err.message}`,
                err,
              );
              cb(err);
            } else {
              this.logger.debug(`Queue ${queueName} exists: ${exists}`);
              cb(null, exists);
            }
          });
        }
      });
    }
  }

  /**
   * Deletes a specific queue.
   *
   * @param queue - The name or parameters for the queue to be deleted.
   * @param cb - Callback function to handle success or error.
   */
  delete(queue: string | IQueueParams, cb: ICallback<void>): void {
    const queueDesc =
      typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
    this.logger.debug(`Deleting queue: ${queueDesc}`);

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
        queueParams,
      );
      return cb(queueParams);
    }

    const queueName = `${queueParams.name}@${queueParams.ns}`;
    this.logger.debug(`Parsed queue parameters: ${queueName}`);

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Error getting Redis client for deleting queue ${queueName}: ${err.message}`,
          err,
        );
        return cb(err);
      }
      if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client is empty for deleting queue ${queueName}`,
          error,
        );
        return cb(error);
      }

      this.logger.debug(`Executing delete queue operation for ${queueName}`);
      _deleteQueue(client, queueParams, undefined, (err, multi) => {
        if (err) {
          this.logger.error(
            `Error preparing delete operation for queue ${queueName}: ${err.message}`,
            err,
          );
          return cb(err);
        }
        if (!multi) {
          const error = new CallbackEmptyReplyError();
          this.logger.error(
            `Multi command is empty for deleting queue ${queueName}`,
            error,
          );
          return cb(error);
        }

        this.logger.debug(
          `Executing multi command to delete queue ${queueName}`,
        );
        multi.exec((err) => {
          if (err) {
            this.logger.error(
              `Error executing multi command for deleting queue ${queueName}: ${err.message}`,
              err,
            );
            return cb(err);
          }

          this.logger.debug(
            `Queue ${queueName} deleted from Redis, emitting queue.queueDeleted event`,
          );
          this.eventBus.getSetInstance((err, instance) => {
            if (err) {
              this.logger.error(
                `Error getting EventBus instance for queue ${queueName}: ${err.message}`,
                err,
              );
              return cb(err);
            }

            if (instance) {
              this.logger.debug(
                `Emitting queue.queueDeleted event for ${queueName}`,
              );
              instance.emit('queue.queueDeleted', queueParams);
            }

            this.logger.info(`Queue ${queueName} successfully deleted`);
            cb();
          });
        });
      });
    });
  }

  /**
   * Retrieves the properties of a specified queue.
   *
   * @param queue - The name or parameters for the queue.
   * @param cb - Callback function to return the queue properties or an error.
   */
  getProperties(
    queue: string | IQueueParams,
    cb: ICallback<IQueueProperties>,
  ): void {
    const queueDesc =
      typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
    this.logger.debug(`Getting properties for queue: ${queueDesc}`);

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
        queueParams,
      );
      cb(queueParams);
    } else {
      const queueName = `${queueParams.name}@${queueParams.ns}`;
      this.logger.debug(`Parsed queue parameters: ${queueName}`);

      this.redisClient.getSetInstance((err, client) => {
        if (err) {
          this.logger.error(
            `Error getting Redis client for queue properties ${queueName}: ${err.message}`,
            err,
          );
          cb(err);
        } else if (!client) {
          const error = new CallbackEmptyReplyError();
          this.logger.error(
            `Redis client is empty for queue properties ${queueName}`,
            error,
          );
          cb(error);
        } else {
          this.logger.debug(`Retrieving properties for queue ${queueName}`);
          _getQueueProperties(client, queueParams, (err, properties) => {
            if (err) {
              this.logger.error(
                `Error getting properties for queue ${queueName}: ${err.message}`,
                err,
              );
              cb(err);
            } else {
              if (properties) {
                this.logger.debug(
                  `Retrieved properties for queue ${queueName}: type=${EQueueType[properties.queueType]}, deliveryModel=${EQueueDeliveryModel[properties.deliveryModel]}`,
                );
              } else {
                this.logger.debug(`No properties found for queue ${queueName}`);
              }
              cb(null, properties);
            }
          });
        }
      });
    }
  }

  /**
   * Fetches all existing queues.
   *
   * @param cb - Callback function to return with a list of queues or an error.
   */
  getQueues(cb: ICallback<IQueueParams[]>): void {
    this.logger.debug('Getting all queues');

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Error getting Redis client for fetching queues: ${err.message}`,
          err,
        );
        cb(err);
      } else if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error('Redis client is empty for fetching queues', error);
        cb(error);
      } else {
        this.logger.debug('Retrieving all queues from Redis');
        _getQueues(client, (err, queues) => {
          if (err) {
            this.logger.error(`Error getting queues: ${err.message}`, err);
            cb(err);
          } else {
            const queueCount = queues?.length || 0;
            this.logger.debug(`Retrieved ${queueCount} queues`);
            cb(null, queues);
          }
        });
      }
    });
  }

  /**
   * Retrieves the consumers for a specified queue.
   *
   * This function accepts either a queue name (string) or queue parameters (IQueueParams)
   * and retrieves the associated consumers using the Redis client. The results are passed
   * to the provided callback function. If any errors occur during parameter parsing or
   * Redis client operations, they are logged and passed to the callback.
   *
   * @param queue - A string representing the queue name or an IQueueParams object with queue details.
   * @param cb - A callback function that receives either an error or a record of consumers.
   */
  getConsumers(
    queue: string | IQueueParams,
    cb: ICallback<Record<string, TQueueConsumer>>,
  ): void {
    const queueDesc =
      typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
    this.logger.debug(`Getting consumers for queue: ${queueDesc}`);

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
        queueParams,
      );
      cb(queueParams);
    } else {
      const queueName = `${queueParams.name}@${queueParams.ns}`;
      this.logger.debug(`Parsed queue parameters: ${queueName}`);

      this.redisClient.getSetInstance((err, client) => {
        if (err) {
          this.logger.error(
            `Error getting Redis client for queue properties ${queueName}: ${err.message}`,
            err,
          );
          cb(err);
        } else if (!client) {
          const error = new CallbackEmptyReplyError();
          this.logger.error(
            `Redis client is empty for queue properties ${queueName}`,
            error,
          );
          cb(error);
        } else {
          _getQueueConsumers(client, queueParams, cb);
        }
      });
    }
  }

  /**
   * Retrieves the consumer IDs for a specified queue.
   *
   * This function accepts either a queue name (string) or queue parameters (IQueueParams)
   * and retrieves the associated consumer IDs using the Redis client. The results are passed
   * to the provided callback function. If any errors occur during parameter parsing or
   * Redis client operations, they are logged and passed to the callback.
   *
   * @param queue - A string representing the queue name or an IQueueParams object with queue details.
   * @param cb - A callback function that receives either an error or an array of consumer IDs.
   */
  getConsumerIds(queue: string | IQueueParams, cb: ICallback<string[]>): void {
    const queueDesc =
      typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
    this.logger.debug(`Getting consumer Ids for queue: ${queueDesc}`);

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
        queueParams,
      );
      cb(queueParams);
    } else {
      const queueName = `${queueParams.name}@${queueParams.ns}`;
      this.logger.debug(`Parsed queue parameters: ${queueName}`);

      this.redisClient.getSetInstance((err, client) => {
        if (err) {
          this.logger.error(
            `Error getting Redis client for queue properties ${queueName}: ${err.message}`,
            err,
          );
          cb(err);
        } else if (!client) {
          const error = new CallbackEmptyReplyError();
          this.logger.error(
            `Redis client is empty for queue properties ${queueName}`,
            error,
          );
          cb(error);
        } else {
          _getQueueConsumerIds(client, queueParams, cb);
        }
      });
    }
  }

  /**
   * Cleans up resources by shutting down the Redis client and event bus.
   *
   * @param {ICallback<void>} cb - Callback function to handle completion of the shutdown process.
   */
  shutdown = (cb: ICallback<void>): void => {
    this.logger.info('Shutting down Queue instance');

    async.waterfall(
      [
        (next: ICallback<void>) => {
          this.logger.debug('Shutting down Redis client');
          this.redisClient.shutdown((err) => {
            if (err) {
              this.logger.error(
                `Error shutting down Redis client: ${err.message}`,
                err,
              );
            } else {
              this.logger.debug('Redis client shutdown successful');
            }
            next(err);
          });
        },
        (next: ICallback<void>) => {
          this.logger.debug('Shutting down EventBus');
          this.eventBus.shutdown((err) => {
            if (err) {
              this.logger.error(
                `Error shutting down EventBus: ${err.message}`,
                err,
              );
            } else {
              this.logger.debug('EventBus shutdown successful');
            }
            next(err);
          });
        },
      ],
      (err) => {
        if (err) {
          this.logger.error(`Error during Queue shutdown: ${err.message}`, err);
        } else {
          this.logger.info('Queue instance shutdown completed successfully');
        }
        cb(err);
      },
    );
  };
}
