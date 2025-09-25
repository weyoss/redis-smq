/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  CallbackEmptyReplyError,
  createLogger,
  EventBusRedis,
  ICallback,
} from 'redis-smq-common';
import { ELuaScriptName } from '../common/redis-client/scripts/scripts.js';
import { redisKeys } from '../common/redis-keys/redis-keys.js';
import { Configuration } from '../config/index.js';
import { _deleteQueue } from './_/_delete-queue.js';
import { _getQueueConsumerIds } from './_/_get-queue-consumer-ids.js';
import { _getQueueConsumers } from './_/_get-queue-consumers.js';
import { _getQueueProperties } from './_/_get-queue-properties.js';
import { _getQueues } from './_/_get-queues.js';
import { _parseQueueParams } from './_/_parse-queue-params.js';
import { _queueExists } from './_/_queue-exists.js';
import { QueueAlreadyExistsError, QueueManagerError } from '../errors/index.js';
import {
  EQueueDeliveryModel,
  EQueueProperty,
  EQueueType,
  IQueueParams,
  IQueueProperties,
  TQueueConsumer,
} from './types/index.js';
import { withSharedPoolConnection } from '../common/redis-connection-pool/with-shared-pool-connection.js';
import { TRedisSMQEvent } from '../common/index.js';

/**
 * The QueueManager class represents an interface that interacts with Redis for storing
 * and managing queues.
 * It provides functionality to create, check existence, delete, retrieve
 * properties of queues, and manage shutdown operations.
 */
export class QueueManager {
  protected eventBus;
  protected logger;

  constructor() {
    const config = Configuration.getConfig();
    this.logger = createLogger(config.logger, this.constructor.name);
    this.logger.debug('Initializing Queue instance');

    // Exclusive EventBus instance is needed for broadcasting queue creation/deletion events independently on
    // user configuration
    this.eventBus = new EventBusRedis<TRedisSMQEvent>(config);
    this.eventBus.on('error', (err) => {
      this.logger.error(`EventBus error: ${err.message}`, err);
    });
    this.logger.debug('EventBus initialized');
  }

  /**
   * Save a new queue with specified parameters.
   * Upon success the callback function is invoked with the created queue details.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/enumerations/EQueueType.md
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/enumerations/EQueueDeliveryModel.md
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
      `Saving queue: ${queueDesc}, type: ${queueType}, delivery model: ${deliveryModel}`,
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

    withSharedPoolConnection((client, done) => {
      const { keyQueueProperties } = redisKeys.getQueueKeys(queueParams, null);
      const { keyNamespaces, keyQueues } = redisKeys.getMainKeys();
      const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(queueParams.ns);

      const keys = [
        keyNamespaces,
        keyNamespaceQueues,
        keyQueues,
        keyQueueProperties,
      ];

      const args: (string | number)[] = [
        queueParams.ns,
        JSON.stringify(queueParams),
        EQueueProperty.QUEUE_TYPE,
        queueType,
        EQueueProperty.DELIVERY_MODEL,
        deliveryModel,
        EQueueProperty.RATE_LIMIT,
        '',
        EQueueProperty.FANOUT_EXCHANGE,
        '',
        EQueueProperty.MESSAGES_COUNT,
        EQueueProperty.ACKNOWLEDGED_MESSAGES_COUNT,
        EQueueProperty.DEAD_LETTERED_MESSAGES_COUNT,
        EQueueProperty.PENDING_MESSAGES_COUNT,
        EQueueProperty.SCHEDULED_MESSAGES_COUNT,
        EQueueProperty.PROCESSING_MESSAGES_COUNT,
        EQueueProperty.DELAYED_MESSAGES_COUNT,
        EQueueProperty.REQUEUED_MESSAGES_COUNT,
      ];

      this.logger.debug(
        `Executing CREATE_QUEUE script for ${queueName} with keys: [${keys.join(', ')}]`,
      );

      client.runScript(
        ELuaScriptName.CREATE_QUEUE,
        keys,
        args,
        (err, reply) => {
          if (err) return done(err);
          if (reply !== 'OK') {
            const error = new QueueAlreadyExistsError();
            this.logger.error(`Queue ${queueName} already exists`, error);
            return done(error);
          }

          this.logger.debug(`Queue ${queueName} created successfully.`);

          // Construct properties locally to save a round-trip to Redis
          const properties: IQueueProperties = {
            queueType,
            deliveryModel,
            rateLimit: null,
            fanoutExchange: null,
            messagesCount: 0,
            acknowledgedMessagesCount: 0,
            deadLetteredMessagesCount: 0,
            pendingMessagesCount: 0,
            scheduledMessagesCount: 0,
            processingMessagesCount: 0,
            delayedMessagesCount: 0,
            requeuedMessagesCount: 0,
          };

          this.ensureEventBusIsRunning((err) => {
            if (err) {
              this.logger.error(err);
              return done(err);
            }
            this.logger.debug(
              `Emitting queue.queueCreated event for ${queueName}`,
            );
            this.eventBus.emit('queue.queueCreated', queueParams, properties);
            this.logger.info(
              `Queue ${queueName} successfully created with type=${queueType}, deliveryModel=${deliveryModel}`,
            );
            done(null, { queue: queueParams, properties });
          });
        },
      );
    }, cb);
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
      withSharedPoolConnection((client, cb) => {
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
      }, cb);
    }
  }

  /**
   * Deletes a specific queue.
   *
   * @param queue - The name or parameters for the queue to be deleted.
   * @param cb - Callback function to handle success or error.
   */
  delete(queue: string | IQueueParams, cb: ICallback): void {
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

    withSharedPoolConnection((client, cb) => {
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
          this.ensureEventBusIsRunning((err) => {
            if (err) {
              this.logger.error(err);
              return cb(err);
            }
            this.logger.debug(
              `Emitting queue.queueDeleted event for ${queueName}`,
            );
            this.eventBus.emit('queue.queueDeleted', queueParams);
            this.logger.info(`Queue ${queueName} successfully deleted`);
            cb();
          });
        });
      });
    }, cb);
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

      withSharedPoolConnection((client, cb) => {
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
                `Retrieved properties for queue ${queueName}: type=${
                  EQueueType[properties.queueType]
                }, deliveryModel=${
                  EQueueDeliveryModel[properties.deliveryModel]
                }`,
              );
            } else {
              this.logger.debug(`No properties found for queue ${queueName}`);
            }
            cb(null, properties);
          }
        });
      }, cb);
    }
  }

  /**
   * Fetches all existing queues.
   *
   * @param cb - Callback function to return with a list of queues or an error.
   */
  getQueues(cb: ICallback<IQueueParams[]>): void {
    this.logger.debug('Getting all queues');
    withSharedPoolConnection((client, cb) => {
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
    }, cb);
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
      return cb(queueParams);
    }

    const queueName = `${queueParams.name}@${queueParams.ns}`;
    this.logger.debug(`Parsed queue parameters: ${queueName}`);

    withSharedPoolConnection(
      (client, cb) => _getQueueConsumers(client, queueParams, cb),
      cb,
    );
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
      return cb(queueParams);
    }

    const queueName = `${queueParams.name}@${queueParams.ns}`;
    this.logger.debug(`Parsed queue parameters: ${queueName}`);

    withSharedPoolConnection(
      (client, cb) => _getQueueConsumerIds(client, queueParams, cb),
      cb,
    );
  }

  /**
   * Cleans up resources by shutting down the Redis client and event bus.
   *
   * @param {ICallback<void>} cb - Callback function to handle completion of the shutdown process.
   */
  shutdown = (cb: ICallback): void => {
    this.logger.info('Shutting down QueueManager instance');
    this.logger.debug('Shutting down EventBus');
    this.eventBus.shutdown((err) => {
      if (err) {
        this.logger.error(`Error shutting down EventBus: ${err.message}`, err);
      } else {
        this.logger.debug('EventBus shutdown successful');
        this.logger.info('Queue instance shutdown completed successfully');
      }
      cb(err);
    });
  };

  protected ensureEventBusIsRunning(cb: ICallback) {
    if (this.eventBus.isRunning()) return cb();
    this.eventBus.run((err, reply) => {
      if (err) return cb(err);
      if (!reply) return cb(new QueueManagerError('EventBus is not running'));
      cb();
    });
  }
}
