/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, createLogger, ICallback, ILogger } from 'redis-smq-common';
import { Configuration } from '../config-manager/configuration.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { IQueueParams } from '../queue-manager/index.js';
import { _deleteConsumerGroup } from './_/_delete-consumer-group.js';
import { _getConsumerGroups } from './_/_get-consumer-groups.js';
import { _saveConsumerGroup } from './_/_save-consumer-group.js';
import { withSharedPoolConnection } from '../common/redis/redis-connection-pool/with-shared-pool-connection.js';

/**
 * Manages consumer groups for PUB/SUB queues.
 *
 * Consumer groups allow multiple consumers to process messages from the same queue,
 * with each message delivered to all groups.
 *
 * @example
 * const consumerGroups = new ConsumerGroups();
 *
 * // Save a consumer group
 * await consumerGroups.saveConsumerGroup('notifications', 'email-group');
 *
 * // Get all consumer groups
 * const groups = await consumerGroups.getConsumerGroups('notifications');
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
   * Saves a consumer group to a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param groupId - Consumer group ID
   * @param cb - (err, result) => void. Returns 1 if created, 0 if already exists
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const result = await consumerGroups.saveConsumerGroup('notifications', 'email-group');
   * console.log(result === 1 ? 'Created' : 'Already exists');
   *
   * // Callback
   * consumerGroups.saveConsumerGroup('notifications', 'email-group', (err, result) => {
   *   if (err) throw err;
   *   console.log(result);
   * });
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
   * Deletes a consumer group from a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param groupId - Consumer group ID
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await consumerGroups.deleteConsumerGroup('notifications', 'email-group');
   *
   * // Callback
   * consumerGroups.deleteConsumerGroup('notifications', 'email-group', (err) => {
   *   if (err) throw err;
   * });
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
   * Gets all consumer groups for a queue.
   *
   * @param queue - Queue name (string) or { name, ns }
   * @param cb - (err, groups) => void. Returns string[]
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * const groups = await consumerGroups.getConsumerGroups('notifications');
   * console.log(groups);
   *
   * // Callback
   * consumerGroups.getConsumerGroups('notifications', (err, groups) => {
   *   if (err) throw err;
   *   console.log(groups);
   * });
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
