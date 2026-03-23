/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, createLogger, ICallback, ILogger } from 'redis-smq-common';
import { Configuration } from '../config/index.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { IQueueParams } from '../queue-manager/index.js';
import { _deleteConsumerGroup } from './_/_delete-consumer-group.js';
import { _getConsumerGroups } from './_/_get-consumer-groups.js';
import { _saveConsumerGroup } from './_/_save-consumer-group.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';

/**
 * The `ConsumerGroups` class is responsible for managing consumer groups within RedisSMQ.
 * It provides functionality to save, delete, and retrieve consumer groups associated with specific queues.
 * The class uses Redis as a backend and employs an event bus for managing events related to consumer groups.
 *
 * Consumer groups are essential for PUB/SUB queues, allowing multiple consumers to process
 * messages from the same queue with each message delivered to all groups.
 *
 * @example
 * ```typescript
 * const consumerGroups = new ConsumerGroups();
 *
 * // Using callback
 * consumerGroups.saveConsumerGroup('notifications', 'group-1', (err, result) => {
 *   if (err) console.error('Failed to save:', err);
 *   else console.log('Consumer group saved:', result);
 * });
 *
 * // Using promise
 * const result = await consumerGroups.saveConsumerGroup('notifications', 'group-1');
 * console.log('Consumer group saved:', result);
 * ```
 */
export class ConsumerGroups {
  protected logger: ILogger;

  constructor() {
    const config = Configuration.getConfig();
    this.logger = createLogger(
      config.logger,
      this.constructor.name.toLowerCase(),
    );
  }

  /**
   * Save Consumer Group
   *
   * Saves a consumer group to a specific queue. This creates a new consumer group
   * for PUB/SUB queues, allowing multiple consumer groups to receive copies of
   * each message published to the queue.
   *
   * **Important Notes:**
   * - Consumer groups are only supported on PUB/SUB queues
   * - Each consumer group ID must be unique within the queue
   * - Saving an existing consumer group returns 0 (already exists)
   * - Creating a new consumer group returns 1
   *
   * @param queue - The queue to which the consumer group belongs (string or IQueueParams)
   * @param groupId - The ID of the consumer group to save
   * @param cb - Optional callback function to handle the result or error
   * @returns {Promise<number> | void} - Returns a Promise if no callback is provided
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid
   * @throws {QueueNotFoundError} When the specified queue doesn't exist
   * @throws {InvalidConsumerGroupIdError} When the group ID is invalid
   * @throws {ConsumerGroupsNotSupportedError} When the queue doesn't support consumer groups
   * @throws {QueueLockedError} When the queue is locked
   * @throws {InvalidQueueStateError} When the queue is in an invalid state
   *
   * @example
   * ```typescript
   * // Callback pattern - create a new consumer group
   * consumerGroups.saveConsumerGroup(
   *   { name: 'notifications', ns: 'default' },
   *   'email-group',
   *   (err, result) => {
   *     if (err) {
   *       console.error('Failed to save consumer group:', err);
   *     } else if (result === 1) {
   *       console.log('Consumer group created successfully');
   *     } else {
   *       console.log('Consumer group already exists');
   *     }
   *   }
   * );
   *
   * // Promise pattern - save consumer group
   * try {
   *   const result = await consumerGroups.saveConsumerGroup('events', 'analytics-group');
   *   console.log(result === 1 ? 'Group created' : 'Group already exists');
   * } catch (err) {
   *   console.error('Failed to save consumer group:', err);
   * }
   * ```
   */
  saveConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
  ): Promise<number>;
  saveConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb: ICallback<number>,
  ): void;
  saveConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb?: ICallback<number>,
  ): Promise<number> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug(
        `Saving consumer group '${groupId}' to queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
      );

      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error(
          `Failed to parse queue parameters: ${queueParams.message}`,
        );
        return callback(queueParams);
      }

      this.logger.debug(
        `Parsed queue parameters: ${JSON.stringify(queueParams)}`,
      );

      withSharedPoolConnection((client, cb) => {
        this.logger.debug('EventBus instance obtained successfully');
        _saveConsumerGroup(client, queueParams, groupId, (err, result) => {
          if (err) {
            this.logger.error(
              `Failed to save consumer group '${groupId}': ${err.message}`,
            );
            return cb(err);
          }

          this.logger.info(
            `Consumer group '${groupId}' ${result === 1 ? 'created' : 'already exists'} for queue: ${queueParams.name}`,
          );
          cb(null, result);
        });
      }, callback);
    });
  }

  /**
   * Delete Consumer Group
   *
   * Deletes a consumer group from a specific queue. This removes the consumer group
   * and prevents further message delivery to consumers in that group.
   *
   * @param queue - The queue from which to delete the consumer group (string or IQueueParams)
   * @param groupId - The ID of the consumer group to delete
   * @param cb - Optional callback function to handle the result or error
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid
   * @throws {QueueNotFoundError} When the specified queue doesn't exist
   * @throws {ConsumerGroupNotEmptyError} When the consumer group still has pending messages
   * @throws {ConsumerGroupsNotSupportedError} When the queue doesn't support consumer groups
   * @throws {QueueLockedError} When the queue is locked
   * @throws {InvalidQueueStateError} When the queue is in an invalid state
   * @throws {UnexpectedScriptReplyError} When Redis returns an unexpected response
   *
   * @example
   * ```typescript
   * // Callback pattern - delete consumer group
   * consumerGroups.deleteConsumerGroup(
   *   'notifications',
   *   'email-group',
   *   (err) => {
   *     if (err) {
   *       console.error('Failed to delete consumer group:', err);
   *     } else {
   *       console.log('Consumer group deleted successfully');
   *     }
   *   }
   * );
   *
   * // Promise pattern - delete consumer group
   * try {
   *   await consumerGroups.deleteConsumerGroup(
   *     { name: 'events', ns: 'production' },
   *     'analytics-group'
   *   );
   *   console.log('Consumer group deleted successfully');
   * } catch (err) {
   *   console.error('Failed to delete consumer group:', err);
   * }
   * ```
   */
  deleteConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
  ): Promise<void>;
  deleteConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb: ICallback<void>,
  ): void;
  deleteConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb?: ICallback<void>,
  ): Promise<void> | void {
    // todo check that consumer group has no active consumers
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug(
        `Deleting consumer group '${groupId}' from queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
      );

      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error(
          `Failed to parse queue parameters: ${queueParams.message}`,
        );
        return callback(queueParams);
      }

      this.logger.debug(
        `Parsed queue parameters: ${JSON.stringify(queueParams)}`,
      );

      withSharedPoolConnection((client, cb) => {
        _deleteConsumerGroup(client, queueParams, groupId, (err) => {
          if (err) {
            this.logger.error(
              `Failed to delete consumer group '${groupId}': ${err.message}`,
            );
            return cb(err);
          }
          this.logger.info(
            `Consumer group '${groupId}' successfully deleted from queue: ${queueParams.name}`,
          );
          cb();
        });
      }, callback);
    });
  }

  /**
   * Get Consumer Groups
   *
   * Retrieves a list of consumer group IDs associated with a specific queue.
   * This method returns all consumer groups that have been created for the queue.
   *
   * @param queue - The queue from which to retrieve consumer groups (string or IQueueParams)
   * @param cb - Optional callback function to handle the result or error
   * @returns {Promise<string[]> | void} - Returns a Promise if no callback is provided
   *
   * @throws {InvalidQueueParametersError} When the queue parameters are invalid
   *
   * @example
   * ```typescript
   * // Callback pattern - get all consumer groups
   * consumerGroups.getConsumerGroups('notifications', (err, groups) => {
   *   if (err) {
   *     console.error('Failed to get consumer groups:', err);
   *   } else {
   *     console.log(`Found ${groups.length} consumer groups:`);
   *     groups.forEach(group => console.log(`  - ${group}`));
   *   }
   * });
   *
   * // Promise pattern - check if group exists
   * try {
   *   const groups = await consumerGroups.getConsumerGroups(
   *     { name: 'events', ns: 'production' }
   *   );
   *
   *   if (groups.includes('analytics-group')) {
   *     console.log('Analytics consumer group exists');
   *   } else {
   *     console.log('Analytics consumer group not found');
   *   }
   * } catch (err) {
   *   console.error('Failed to get consumer groups:', err);
   * }
   * ```
   */
  getConsumerGroups(queue: string | IQueueParams): Promise<string[]>;
  getConsumerGroups(
    queue: string | IQueueParams,
    cb: ICallback<string[]>,
  ): void;
  getConsumerGroups(
    queue: string | IQueueParams,
    cb?: ICallback<string[]>,
  ): Promise<string[]> | void {
    return async.withOptionalCallback(cb, (callback) => {
      this.logger.debug(
        `Getting consumer groups for queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
      );

      const queueParams = _parseQueueParams(queue);
      if (queueParams instanceof Error) {
        this.logger.error(
          `Failed to parse queue parameters: ${queueParams.message}`,
        );
        return callback(queueParams);
      }

      this.logger.debug(
        `Parsed queue parameters: ${JSON.stringify(queueParams)}`,
      );

      withSharedPoolConnection((client, cb) => {
        _getConsumerGroups(client, queueParams, (err, groups) => {
          if (err) {
            this.logger.error(`Failed to get consumer groups: ${err.message}`);
            return cb(err);
          }

          this.logger.info(
            `Retrieved ${Number(groups?.length)} consumer groups for queue: ${queueParams.name}`,
          );
          if (groups && groups.length > 0) {
            this.logger.debug(`Consumer groups: ${JSON.stringify(groups)}`);
          }

          cb(null, groups);
        });
      }, callback);
    });
  }
}
