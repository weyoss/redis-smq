/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createLogger, ICallback, ILogger } from 'redis-smq-common';
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
   * Saves a consumer group to a specific queue.
   *
   * @throws InvalidQueueParametersError
   * @throws QueueNotFoundError
   * @throws InvalidConsumerGroupIdError
   * @throws ConsumerGroupsNotSupportedError
   *
   * @param {string | IQueueParams} queue - The queue to which the consumer group belongs.
   * @param {string} groupId - The ID of the consumer group to save.
   * @param {ICallback<number>} cb - Callback function to handle the result or error.
   */
  saveConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb: ICallback<number>,
  ): void {
    this.logger.debug(
      `Saving consumer group '${groupId}' to queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
    );

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Failed to parse queue parameters: ${queueParams.message}`,
      );
      return cb(queueParams);
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
    }, cb);
  }

  /**
   * Delete Consumer Group
   *
   * Deletes a consumer group from a specific queue.
   *
   * @throws InvalidQueueParametersError
   * @throws QueueNotFoundError
   * @throws ConsumerGroupNotEmptyError
   * @throws ConsumerGroupsNotSupportedError
   * @throws QueueOperationForbiddenError
   * @throws UnexpectedScriptReplyError
   *
   * @param {string | IQueueParams} queue - The queue from which to delete the consumer group.
   * @param {string} groupId - The ID of the consumer group to delete.
   * @param {ICallback<void>} cb - Callback function to handle the result or error.
   */
  deleteConsumerGroup(
    queue: string | IQueueParams,
    groupId: string,
    cb: ICallback<void>,
  ): void {
    this.logger.debug(
      `Deleting consumer group '${groupId}' from queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
    );

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Failed to parse queue parameters: ${queueParams.message}`,
      );
      return cb(queueParams);
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
    }, cb);
  }

  /**
   * Get Consumer Groups
   *
   * Retrieves a list of consumer group IDs associated with a specific queue.
   *
   * @throws InvalidQueueParametersError
   *
   * @param {string | IQueueParams} queue - The queue from which to retrieve consumer groups.
   * @param {ICallback<string[]>} cb - Callback function to handle the result or error.
   */
  getConsumerGroups(
    queue: string | IQueueParams,
    cb: ICallback<string[]>,
  ): void {
    this.logger.debug(
      `Getting consumer groups for queue: ${typeof queue === 'string' ? queue : JSON.stringify(queue)}`,
    );

    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) {
      this.logger.error(
        `Failed to parse queue parameters: ${queueParams.message}`,
      );
      return cb(queueParams);
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
    }, cb);
  }
}
