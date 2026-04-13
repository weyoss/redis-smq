/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, createLogger, ICallback } from 'redis-smq-common';
import { ERedisScriptName } from '../common/redis/scripts.js';
import { redisKeys } from '../common/redis/redis-keys/redis-keys.js';
import { Configuration } from '../config-manager/configuration.js';
import { _deleteQueue } from './_/_delete-queue.js';
import { _getQueueConsumerIds } from './_/_get-queue-consumer-ids.js';
import { _getQueueConsumers } from './_/_get-queue-consumers.js';
import { _getQueueProperties } from './_/_get-queue-properties.js';
import { _getQueues } from './_/_get-queues.js';
import { _parseQueueParams } from './_/_parse-queue-params.js';
import { _queueExists } from './_/_queue-exists.js';
import {
  QueueAlreadyExistsError,
  UnexpectedScriptReplyError,
} from '../errors/index.js';
import {
  EQueueDeliveryModel,
  EQueueOperationalState,
  EQueueProperty,
  EQueueType,
  IQueueParams,
  IQueueProperties,
  TQueueConsumer,
} from './types/index.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';
import { EventMultiplexer } from '../event-bus/event-multiplexer.js';
import { maxQueueStateHistorySize } from '../queue-state-manager/_/_set-queue-state.js';
import {
  ESystemStateTransitionReason,
  IQueueStateTransition,
} from '../queue-state-manager/index.js';

/**
 * Manages queue lifecycle and metadata operations.
 *
 * Provides methods to create, delete, check existence, and retrieve
 * queue properties, consumers, and consumer IDs.
 *
 * @example
 * const queueManager = new QueueManager();
 *
 * // Create a queue
 * const { queue, properties } = await queueManager.save(
 *   'orders',
 *   EQueueType.FIFO,
 *   EQueueDeliveryModel.POINT_TO_POINT
 * );
 *
 * // Get all queues
 * const queues = await queueManager.getQueues();
 */
export class QueueManager {
  protected logger;

  constructor() {
    const config = Configuration.getConfig();
    this.logger = createLogger(config.logger, this.constructor.name);
  }

  /**
   * Creates a new queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param queueType - FIFO, LIFO, or PRIORITY
   * @param deliveryModel - POINT_TO_POINT or PUB_SUB
   * @param cb - (err, result) => void. Result contains { queue: IQueueParams; properties: IQueueProperties }
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const result = await queueManager.save('orders', EQueueType.FIFO, EQueueDeliveryModel.POINT_TO_POINT);
   *
   * // Callback
   * queueManager.save('orders', EQueueType.FIFO, EQueueDeliveryModel.POINT_TO_POINT, (err, result) => {
   *   if (err) throw err;
   *   console.log(result.queue);
   * });
   */
  save(
    queue: string | IQueueParams,
    queueType: EQueueType,
    deliveryModel: EQueueDeliveryModel,
  ): Promise<{ queue: IQueueParams; properties: IQueueProperties }>;
  save(
    queue: string | IQueueParams,
    queueType: EQueueType,
    deliveryModel: EQueueDeliveryModel,
    cb: ICallback<{ queue: IQueueParams; properties: IQueueProperties }>,
  ): void;
  save(
    queue: string | IQueueParams,
    queueType: EQueueType,
    deliveryModel: EQueueDeliveryModel,
    cb?: ICallback<{ queue: IQueueParams; properties: IQueueProperties }>,
  ): Promise<{ queue: IQueueParams; properties: IQueueProperties }> | void {
    return async.withOptionalCallback(cb, (callback) => {
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
        return callback(queueParams);
      }

      const queueName = `${queueParams.name}@${queueParams.ns}`;
      this.logger.debug(`Parsed queue parameters: ${queueName}`);

      withSharedPoolConnection((client, done) => {
        const { keyQueueProperties, keyQueueStateHistory } =
          redisKeys.getQueueKeys(queueParams.ns, queueParams.name, null);
        const { keyNamespaces, keyQueues } = redisKeys.getMainKeys();
        const { keyNamespaceQueues } = redisKeys.getNamespaceKeys(
          queueParams.ns,
        );

        const keys = [
          keyNamespaces,
          keyNamespaceQueues,
          keyQueues,
          keyQueueProperties,
          keyQueueStateHistory,
        ];

        const now = Date.now();

        const initialState: IQueueStateTransition = {
          timestamp: now,
          from: null,
          to: EQueueOperationalState.ACTIVE,
          reason: ESystemStateTransitionReason.SYSTEM_INIT,
          metadata: {
            queueType,
            deliveryModel,
          },
        };
        const initialTransitionData = JSON.stringify(initialState);

        const args: (string | number)[] = [
          queueParams.ns,
          JSON.stringify(queueParams),
          EQueueProperty.QUEUE_TYPE,
          queueType,
          EQueueProperty.DELIVERY_MODEL,
          deliveryModel,
          EQueueProperty.RATE_LIMIT,
          '',
          EQueueProperty.MESSAGES_COUNT,
          EQueueProperty.ACKNOWLEDGED_MESSAGES_COUNT,
          EQueueProperty.DEAD_LETTERED_MESSAGES_COUNT,
          EQueueProperty.PENDING_MESSAGES_COUNT,
          EQueueProperty.SCHEDULED_MESSAGES_COUNT,
          EQueueProperty.PROCESSING_MESSAGES_COUNT,
          EQueueProperty.DELAYED_MESSAGES_COUNT,
          EQueueProperty.REQUEUED_MESSAGES_COUNT,
          EQueueProperty.OPERATIONAL_STATE,
          EQueueOperationalState.ACTIVE,
          maxQueueStateHistorySize,
          EQueueProperty.LAST_STATE_CHANGE_AT,
          now,
          EQueueProperty.LOCK_ID,
          initialTransitionData,
        ];

        this.logger.debug(
          `Executing CREATE_QUEUE script for ${queueName} with keys: [${keys.join(', ')}]`,
        );

        client.runScript(
          ERedisScriptName.CREATE_QUEUE,
          keys,
          args,
          (err, reply) => {
            if (err) return done(err);
            if (!['OK', 'QUEUE_EXISTS'].includes(String(reply))) {
              this.logger.error(
                'CREATE_QUEUE script returned an unexpected reply: ',
                reply,
              );
              return done(
                new UnexpectedScriptReplyError({ metadata: { reply } }),
              );
            }
            if (reply === 'QUEUE_EXISTS') {
              const error = new QueueAlreadyExistsError();
              this.logger.error(`Queue ${queueName} already exists`, error);
              return done(error);
            }

            this.logger.debug(`Queue ${queueName} created successfully.`);

            const properties: IQueueProperties = {
              queueType,
              deliveryModel,
              rateLimit: null,
              messagesCount: 0,
              acknowledgedMessagesCount: 0,
              deadLetteredMessagesCount: 0,
              pendingMessagesCount: 0,
              scheduledMessagesCount: 0,
              processingMessagesCount: 0,
              delayedMessagesCount: 0,
              requeuedMessagesCount: 0,
              operationalState: EQueueOperationalState.ACTIVE,
              lockId: null,
              lastStateChangeAt: now,
            };

            this.logger.debug(
              `Emitting queue.queueCreated event for ${queueName}`,
            );
            EventMultiplexer.publish(
              'queue.queueCreated',
              queueParams,
              properties,
            );
            this.logger.info(
              `Queue ${queueName} successfully created with type=${queueType}, deliveryModel=${deliveryModel}, state=${EQueueOperationalState.ACTIVE}`,
            );
            done(null, { queue: queueParams, properties });
          },
        );
      }, callback);
    });
  }

  /**
   * Checks if a queue exists.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, exists) => void. Returns boolean
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const exists = await queueManager.exists('orders');
   *
   * // Callback
   * queueManager.exists('orders', (err, exists) => {
   *   if (err) throw err;
   *   console.log(exists);
   * });
   */
  exists(queue: string | IQueueParams): Promise<boolean>;
  exists(queue: string | IQueueParams, cb: ICallback<boolean>): void;
  exists(
    queue: string | IQueueParams,
    cb?: ICallback<boolean>,
  ): Promise<boolean> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueDesc =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Checking if queue exists: ${queueDesc}`);

      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error(
          `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
          queueParams,
        );
        callback(queueParams);
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
        }, callback);
      }
    });
  }

  /**
   * Deletes a queue and all its data.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await queueManager.delete('old-queue');
   *
   * // Callback
   * queueManager.delete('old-queue', (err) => {
   *   if (err) throw err;
   * });
   */
  delete(queue: string | IQueueParams): Promise<void>;
  delete(queue: string | IQueueParams, cb: ICallback): void;
  delete(queue: string | IQueueParams, cb?: ICallback): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueDesc =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Deleting queue: ${queueDesc}`);

      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error(
          `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
          queueParams,
        );
        return callback(queueParams);
      }

      const queueName = `${queueParams.name}@${queueParams.ns}`;
      this.logger.debug(`Parsed queue parameters: ${queueName}`);

      withSharedPoolConnection((client, cb) => {
        this.logger.debug(`Executing delete queue operation for ${queueName}`);
        _deleteQueue(client, queueParams, (err) => {
          if (err) {
            this.logger.error(
              `Error deleting queue ${queueName}: ${err.message}`,
              err,
            );
            return cb(err);
          }
          this.logger.debug(
            `Queue ${queueName} deleted from Redis, emitting queue.queueDeleted event`,
          );
          EventMultiplexer.publish('queue.queueDeleted', queueParams);
          this.logger.info(
            `Queue ${queueParams.name}@${queueParams.ns} successfully deleted`,
          );
          cb();
        });
      }, callback);
    });
  }

  /**
   * Gets queue properties including counts and state.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, properties) => void. Returns IQueueProperties
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const props = await queueManager.getProperties('orders');
   * console.log(props.pendingMessagesCount);
   *
   * // Callback
   * queueManager.getProperties('orders', (err, props) => {
   *   if (err) throw err;
   *   console.log(props);
   * });
   */
  getProperties(queue: string | IQueueParams): Promise<IQueueProperties>;
  getProperties(
    queue: string | IQueueParams,
    cb: ICallback<IQueueProperties>,
  ): void;
  getProperties(
    queue: string | IQueueParams,
    cb?: ICallback<IQueueProperties>,
  ): Promise<IQueueProperties> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueDesc =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Getting properties for queue: ${queueDesc}`);

      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error(
          `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
          queueParams,
        );
        callback(queueParams);
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
                  }, state=${properties.operationalState}`,
                );
              } else {
                this.logger.debug(`No properties found for queue ${queueName}`);
              }
              cb(null, properties);
            }
          });
        }, callback);
      }
    });
  }

  /**
   * Gets all queues across all namespaces.
   *
   * @param cb - (err, queues) => void. Returns IQueueParams[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const queues = await queueManager.getQueues();
   * queues.forEach(q => console.log(`${q.name}@${q.ns}`));
   *
   * // Callback
   * queueManager.getQueues((err, queues) => {
   *   if (err) throw err;
   *   console.log(queues);
   * });
   */
  getQueues(): Promise<IQueueParams[]>;
  getQueues(cb: ICallback<IQueueParams[]>): void;
  getQueues(cb?: ICallback<IQueueParams[]>): Promise<IQueueParams[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
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
      }, callback);
    });
  }

  /**
   * Gets active consumers for a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, consumers) => void. Returns Record<string, TQueueConsumer>
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const consumers = await queueManager.getConsumers('orders');
   * console.log(Object.keys(consumers).length);
   *
   * // Callback
   * queueManager.getConsumers('orders', (err, consumers) => {
   *   if (err) throw err;
   *   console.log(consumers);
   * });
   */
  getConsumers(
    queue: string | IQueueParams,
  ): Promise<Record<string, TQueueConsumer>>;
  getConsumers(
    queue: string | IQueueParams,
    cb: ICallback<Record<string, TQueueConsumer>>,
  ): void;
  getConsumers(
    queue: string | IQueueParams,
    cb?: ICallback<Record<string, TQueueConsumer>>,
  ): Promise<Record<string, TQueueConsumer>> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueDesc =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Getting consumers for queue: ${queueDesc}`);

      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error(
          `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
          queueParams,
        );
        return callback(queueParams);
      }

      const queueName = `${queueParams.name}@${queueParams.ns}`;
      this.logger.debug(`Parsed queue parameters: ${queueName}`);

      withSharedPoolConnection(
        (client, cb) => _getQueueConsumers(client, queueParams, cb),
        callback,
      );
    });
  }

  /**
   * Gets consumer IDs for a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, consumerIds) => void. Returns string[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const ids = await queueManager.getConsumerIds('orders');
   * console.log(ids);
   *
   * // Callback
   * queueManager.getConsumerIds('orders', (err, ids) => {
   *   if (err) throw err;
   *   console.log(ids);
   * });
   */
  getConsumerIds(queue: string | IQueueParams): Promise<string[]>;
  getConsumerIds(queue: string | IQueueParams, cb: ICallback<string[]>): void;
  getConsumerIds(
    queue: string | IQueueParams,
    cb?: ICallback<string[]>,
  ): Promise<string[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      const queueDesc =
        typeof queue === 'string' ? queue : `${queue.name}@${queue.ns}`;
      this.logger.debug(`Getting consumer Ids for queue: ${queueDesc}`);

      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error(
          `Error parsing queue parameters for ${queueDesc}: ${queueParams.message}`,
          queueParams,
        );
        return callback(queueParams);
      }

      const queueName = `${queueParams.name}@${queueParams.ns}`;
      this.logger.debug(`Parsed queue parameters: ${queueName}`);

      withSharedPoolConnection(
        (client, cb) => _getQueueConsumerIds(client, queueParams, cb),
        callback,
      );
    });
  }
}
