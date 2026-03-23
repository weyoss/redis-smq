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
import { Configuration } from '../config/index.js';
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
 * The QueueManager class represents an interface that interacts with Redis for storing
 * and managing queues.
 * It provides functionality to create, check existence, delete, retrieve
 * properties of queues, and manage shutdown operations.
 *
 * @example
 * ```typescript
 * const queueManager = new QueueManager();
 *
 * // Using callback
 * queueManager.getQueues((err, queues) => {
 *   if (err) {
 *     console.error('Failed to get queues:', err);
 *   } else {
 *     console.log('Queues:', queues);
 *   }
 * });
 *
 * // Using promise
 * const queues = await queueManager.getQueues();
 * console.log('Queues:', queues);
 * ```
 */
export class QueueManager {
  protected logger;

  constructor() {
    const config = Configuration.getConfig();
    this.logger = createLogger(config.logger, this.constructor.name);
  }

  /**
   * Save a new queue with specified parameters.
   * Upon success the callback function is invoked with the created queue details.
   *
   * This method creates a new queue in the system with the specified type and
   * delivery model. The queue is initially created in the ACTIVE operational state.
   *
   * @see /packages/redis-smq/docs/api/enumerations/EQueueType.md
   * @see /packages/redis-smq/docs/api/enumerations/EQueueDeliveryModel.md
   *
   * @param queue - The name or parameters for the queue (can be string name or object with ns/name)
   * @param queueType - The type of the queue, defined by EQueueType
   * @param deliveryModel - The model for message delivery, defined by EQueueDeliveryModel
   * @param cb - Optional callback function to handle success or error.
   *             - On success: `cb(null, { queue, properties })` where properties include queue metadata.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the result.
   * @returns {Promise<{ queue: IQueueParams; properties: IQueueProperties }> | void} -
   *          Returns a Promise if no callback is provided, otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueAlreadyExistsError} When a queue with the same name and namespace already exists.
   * @throws {UnexpectedScriptReplyError} When Redis returns an unexpected response.
   *
   * @example
   * ```typescript
   * const queueManager = new QueueManager();
   *
   * // Callback pattern
   * queueManager.save(
   *   { ns: 'production', name: 'orders' },
   *   EQueueType.FIFO,
   *   EQueueDeliveryModel.POINT_TO_POINT,
   *   (err, result) => {
   *     if (err) {
   *       console.error('Failed to create queue:', err);
   *     } else {
   *       console.log('Queue created:', result.queue);
   *       console.log('Properties:', result.properties);
   *     }
   *   }
   * );
   *
   * // Promise pattern
   * try {
   *   const result = await queueManager.save(
   *     'notifications',
   *     EQueueType.FIFO,
   *     EQueueDeliveryModel.PUB_SUB
   *   );
   *   console.log(`Queue ${result.queue.name} created successfully`);
   * } catch (err) {
   *    console.error('Failed to create queue:', err);
   * }
   * ```
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
          keyQueueStateHistory, // New key for state history
        ];

        // Get current timestamp for state change
        const now = Date.now();

        // Create initial state transition data
        const initialState: IQueueStateTransition = {
          timestamp: now,
          from: null, // No previous state for initial transition
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
          // New arguments for state management
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

            // Construct properties with initial state
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
   * Checks if a specified queue exists.
   *
   * This method determines whether a queue with the given name and namespace
   * exists in the system. It returns a boolean indicating existence.
   *
   * **Use Cases:**
   * - Pre-flight checks before operations
   * - Validating queue existence in application logic
   * - Conditional queue creation
   *
   * @param queue - The name or parameters for the queue (string name or object with ns/name)
   * @param cb - Optional callback function to return a boolean indicating existence.
   *             - On success: `cb(null, exists)` where exists is true if queue exists.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with the boolean.
   * @returns {Promise<boolean> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   *
   * @example
   * ```typescript
   * const queueManager = new QueueManager();
   *
   * // Callback pattern
   * queueManager.exists('my-queue', (err, exists) => {
   *   if (err) {
   *     console.error('Failed to check existence:', err);
   *   } else if (exists) {
   *     console.log('Queue exists');
   *   } else {
   *     console.log('Queue does not exist');
   *   }
   * });
   *
   * // Promise pattern
   * const exists = await queueManager.exists({ ns: 'production', name: 'orders' });
   * if (exists) {
   *   console.log('Queue exists, proceeding with operation');
   * } else {
   *   console.log('Queue does not exist, creating...');
   *   await queueManager.save('orders', EQueueType.FIFO, EQueueDeliveryModel.POINT_TO_POINT);
   * }
   * ```
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
   * Deletes a specific queue.
   *
   * This method removes a queue and all its associated data from the system.
   * The deletion process is comprehensive and includes validation checks to
   * ensure the queue can be safely deleted.
   *
   * @param queue - The name or parameters for the queue to be deleted
   * @param cb - Optional callback function to handle success or error.
   *             - On success: `cb(null)`
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves when deleted.
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   * @throws {QueueNotEmptyError} When the queue has messages.
   * @throws {QueueManagerActiveConsumersError} When there are active consumers.
   * @throws {QueueHasBoundExchangesError} When exchanges are bound to the queue.
   * @throws {ConsumerSetMismatchError} When consumer set is inconsistent.
   * @throws {QueueLockedError} When the queue is locked.
   * @throws {InvalidQueueStateError} When the queue is in an invalid state.
   * @throws {UnexpectedScriptReplyError} When Redis returns an unexpected response.
   *
   * @example
   * ```typescript
   * const queueManager = new QueueManager();
   *
   * // Callback pattern
   * queueManager.delete('old-queue', (err) => {
   *   if (err) {
   *     console.error('Failed to delete queue:', err);
   *   } else {
   *     console.log('Queue deleted successfully');
   *   }
   * });
   *
   * // Promise pattern
   * async function safeDeleteQueue(queueName: string) {
   *   try {
   *     await queueManager.delete(queueName);
   *     console.log('Queue deleted successfully');
   *   } catch (err) {
   *     console.error('Failed to delete queue:', err);
   *   }
   * }
   * ```
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
   * Retrieves the properties of a specified queue.
   *
   * @param queue - The name or parameters for the queue (string name or object with ns/name)
   * @param cb - Optional callback function to return the queue properties or an error.
   *             - On success: `cb(null, properties)` where properties is the queue metadata.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with properties.
   * @returns {Promise<IQueueProperties> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   *
   * @example
   * ```typescript
   * const queueManager = new QueueManager();
   *
   * // Callback pattern
   * queueManager.getProperties('my-queue', (err, properties) => {
   *   if (err) {
   *     console.error('Failed to get properties:', err);
   *   } else {
   *     console.log('Queue type:', EQueueType[properties.queueType]);
   *     console.log('Delivery model:', EQueueDeliveryModel[properties.deliveryModel]);
   *     console.log('Operational state:', properties.operationalState);
   *     console.log('Total messages:', properties.messagesCount);
   *     console.log('Pending:', properties.pendingMessagesCount);
   *     console.log('Processing:', properties.processingMessagesCount);
   *   }
   * });
   *
   * // Promise pattern
   * async function monitorQueueHealth(queueName: string) {
   *   try {
   *     const props = await queueManager.getProperties(queueName);
   *     // ...
   *   } catch (err) {
   *     console.error('Failed to monitor queue:', err);
   *   }
   * }
   * ```
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
   * Fetches all existing queues.
   *
   * This method returns a list of all queues currently defined in the system,
   * across all namespaces. Each queue is represented by its parameters including
   * name and namespace.
   *
   * @param cb - Optional callback function to return a list of queues or an error.
   *             - On success: `cb(null, queues)` where queues is an array of queue parameters.
   *             - On error: `cb(error)` with any Redis or system errors.
   *             - If not provided, the method returns a Promise that resolves with the list.
   * @returns {Promise<IQueueParams[]> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @example
   * ```typescript
   * const queueManager = new QueueManager();
   *
   * // Callback pattern
   * queueManager.getQueues((err, queues) => {
   *   if (err) {
   *     console.error('Failed to get queues:', err);
   *   } else {
   *     console.log(`Found ${queues.length} queues:`);
   *     queues.forEach(queue => {
   *       console.log(`  - ${queue.name}@${queue.ns}`);
   *     });
   *   }
   * });
   *
   * // Promise pattern - list all queues with details
   * async function listAllQueuesWithDetails() {
   *   try {
   *     const queues = await queueManager.getQueues();
   *     console.log(`Total queues: ${queues.length}`);
   *   } catch (err) {
   *     console.error('Failed to list queues:', err);
   *   }
   * }
   * ```
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
   * Retrieves the consumers for a specified queue.
   *
   * This method returns detailed information about all consumers currently
   * connected to and consuming from the specified queue. Each consumer record
   * includes the consumer ID and metadata about its connection.
   *
   * @param queue - A string representing the queue name or an IQueueParams object with queue details
   * @param cb - Optional callback function that receives either an error or a record of consumers.
   *             - On success: `cb(null, consumers)` where consumers is an object mapping
   *               consumer IDs to consumer details.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with consumers.
   * @returns {Promise<Record<string, TQueueConsumer>> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   *
   * @example
   * ```typescript
   * const queueManager = new QueueManager();
   *
   * // Callback pattern
   * queueManager.getConsumers('my-queue', (err, consumers) => {
   *   if (err) {
   *     console.error('Failed to get consumers:', err);
   *   } else {
   *     const consumerCount = Object.keys(consumers).length;
   *     console.log(`Found ${consumerCount} active consumers:`);
   *
   *     Object.entries(consumers).forEach(([id, consumer]) => {
   *       console.log(`  Consumer: ${id}`);
   *       console.log(`    Started: ${new Date(consumer.startTime)}`);
   *       console.log(`    Heartbeat: ${consumer.heartbeat}`);
   *     });
   *   }
   * });
   *
   * // Promise pattern
   * async function analyzeConsumerDistribution() {
   *   const queues = await queueManager.getQueues();
   *   const distribution = {};
   *
   *   for (const queue of queues) {
   *     const consumers = await queueManager.getConsumers(queue);
   *     distribution[`${queue.name}@${queue.ns}`] = Object.keys(consumers).length;
   *   }
   *
   *   console.log('Consumer distribution:', distribution);
   * }
   * ```
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
   * Retrieves the consumer IDs for a specified queue.
   *
   * This method returns a simplified list of consumer IDs for a queue,
   * without the full consumer details. It's useful for quick checks
   * and when only the consumer IDs are needed.
   *
   * @param queue - A string representing the queue name or an IQueueParams object with queue details
   * @param cb - Optional callback function that receives either an error or an array of consumer IDs.
   *             - On success: `cb(null, consumerIds)` where consumerIds is an array of consumer IDs.
   *             - On error: `cb(error)` with one of the errors listed below.
   *             - If not provided, the method returns a Promise that resolves with consumer IDs.
   * @returns {Promise<string[]> | void} - Returns a Promise if no callback is provided,
   *          otherwise returns void.
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid.
   * @throws {QueueNotFoundError} When the specified queue doesn't exist.
   *
   * @example
   * ```typescript
   * const queueManager = new QueueManager();
   *
   * // Callback pattern
   * queueManager.getConsumerIds('my-queue', (err, consumerIds) => {
   *   if (err) {
   *     console.error('Failed to get consumer IDs:', err);
   *   } else {
   *     console.log(`Consumer IDs: ${consumerIds.join(', ')}`);
   *     console.log(`Total consumers: ${consumerIds.length}`);
   *   }
   * });
   *
   * // Promise pattern
   * async function hasActiveConsumers(queueName: string): Promise<boolean> {
   *   try {
   *     const consumerIds = await queueManager.getConsumerIds(queueName);
   *     return consumerIds.length > 0;
   *   } catch (err) {
   *     console.error('Failed to check consumers:', err);
   *     return false;
   *   }
   * }
   * ```
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
