/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { IQueueParsedParams } from '../../queue/index.js';
import { QueueMessagesStorage } from './queue-messages-storage.js';
import { RedisClient } from '../../../common/redis-client/redis-client.js';

/**
 * Implementation of QueueMessagesStorage for Redis sets
 */
export class QueueMessagesStorageSet extends QueueMessagesStorage {
  /**
   * @param redisClient Redis client instance
   */
  constructor(redisClient: RedisClient) {
    super(redisClient);
    this.logger.debug(
      'QueueMessagesStorageSet instance created for Redis sets',
    );
  }

  /**
   * Count items in a Redis set
   * @param queue Queue parameters
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  count(
    queue: IQueueParsedParams,
    redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
    cb: ICallback<number>,
  ): void {
    const queueName = `${queue.queueParams.name}@${queue.queueParams.ns}`;
    this.logger.debug(
      `Starting count operation for queue=${queueName}, key=${redisKey}`,
    );

    const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
    const key = keys[redisKey];

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Redis client error during count operation: ${err.message}`,
          err,
        );
        return cb(err);
      } else if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client error during count operation: ${error.message}`,
          error,
        );
        return cb(error);
      }

      this.logger.debug(`Executing SCARD on ${key}`);

      client.scard(key, (err, reply) => {
        if (err) {
          this.logger.error(
            `Error in count operation for queue=${queueName}, key=${redisKey}: ${err.message}`,
            err,
          );
          return cb(err);
        }

        this.logger.debug(`SCARD operation completed, count=${reply}`);
        this.logger.debug(
          `Completed count operation for queue=${queueName}, key=${redisKey}, count=${reply}`,
        );
        cb(null, reply);
      });
    });
  }

  /**
   * Fetch items from a Redis set with pagination
   * @param queue Queue parameters
   * @param redisKey Redis key for the specific queue type
   * @param offset Start index
   * @param limit Number of items to fetch
   * @param cb Callback function
   */
  fetchItems(
    queue: IQueueParsedParams,
    redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
    offset: number,
    limit: number,
    cb: ICallback<string[]>,
  ): void {
    const queueName = `${queue.queueParams.name}@${queue.queueParams.ns}`;
    this.logger.debug(
      `Starting fetchItems operation for queue=${queueName}, key=${redisKey}, offset=${offset}, limit=${limit}`,
    );

    const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
    const key = keys[redisKey];

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Redis client error during fetchItems operation: ${err.message}`,
          err,
        );
        return cb(err);
      } else if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client error during fetchItems operation: ${error.message}`,
          error,
        );
        return cb(error);
      }

      this.logger.debug(
        `Executing SSCAN on ${key} with cursor=${offset.toString()}, count=${limit}`,
      );

      client.sscan(key, offset.toString(), { COUNT: limit }, (err, reply) => {
        if (err) {
          this.logger.error(
            `Error in fetchItems operation for queue=${queueName}, key=${redisKey}: ${err.message}`,
            err,
          );
          return cb(err);
        }

        const items = reply?.items || [];
        const totalFound = items.length;

        this.logger.debug(
          `SSCAN operation completed, found ${totalFound} items`,
        );

        // Apply pagination manually
        let result: string[];
        if (offset >= totalFound) {
          this.logger.debug(
            `Offset ${offset} exceeds total items ${totalFound}, returning empty array`,
          );
          result = [];
        } else {
          const paginatedItems = items.slice(0, limit);
          this.logger.debug(
            `Applied pagination: returning ${paginatedItems.length} items`,
          );
          result = paginatedItems;
        }

        this.logger.debug(
          `Completed fetchItems operation for queue=${queueName}, key=${redisKey}, items=${result.length}`,
        );
        cb(null, result);
      });
    });
  }

  /**
   * Fetch all items from a Redis set
   *
   * @param queue Queue parameters
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  fetchAllItems(
    queue: IQueueParsedParams,
    redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
    cb: ICallback<string[]>,
  ): void {
    const queueName = `${queue.queueParams.name}@${queue.queueParams.ns}`;
    this.logger.debug(
      `Starting fetchAllItems operation for queue=${queueName}, key=${redisKey}`,
    );

    const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
    const key = keys[redisKey];

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Redis client error during fetchAllItems operation: ${err.message}`,
          err,
        );
        return cb(err);
      } else if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client error during fetchAllItems operation: ${error.message}`,
          error,
        );
        return cb(error);
      }

      this.logger.debug(`Executing SMEMBERS on ${key}`);

      client.smembers(key, (err, items) => {
        if (err) {
          this.logger.error(
            `Error in fetchAllItems operation for queue=${queueName}, key=${redisKey}: ${err.message}`,
            err,
          );
          return cb(err);
        }

        const itemCount = items ? items.length : 0;

        this.logger.debug(
          `SMEMBERS operation completed, retrieved ${itemCount} items`,
        );

        if (itemCount === 0) {
          this.logger.debug(`Set ${key} is empty`);
        } else {
          this.logger.debug(
            `Successfully retrieved all ${itemCount} items from set ${key}`,
          );
        }

        this.logger.debug(
          `Completed fetchAllItems operation for queue=${queueName}, key=${redisKey}, items=${itemCount}`,
        );
        cb(null, items || []);
      });
    });
  }
}
