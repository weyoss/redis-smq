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
 * Implementation of QueueMessagesStorage for Redis sorted sets.
 * Provides specialized methods for working with sorted sets in Redis
 * for queue message storage operations.
 */
export class QueueMessagesStorageSortedSet extends QueueMessagesStorage {
  /**
   * @param redisClient Redis client instance
   */
  constructor(redisClient: RedisClient) {
    super(redisClient);
    this.logger.debug(
      'QueueMessagesStorageSortedSet instance created for Redis sorted sets',
    );
  }

  /**
   * Count items in a Redis sorted set
   *
   * @param queue - Queue parameters
   * @param redisKey - Redis key for the specific queue type
   * @param cb - Callback function
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

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Redis client error during count operation: ${err.message}`,
          err,
        );
        cb(err);
      } else if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client error during count operation: ${error.message}`,
          error,
        );
        cb(error);
      } else {
        const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
        const key = keys[redisKey];

        this.logger.debug(`Executing ZCARD on ${key}`);

        client.zcard(key, (err, count) => {
          if (err) {
            this.logger.error(
              `Error in count operation for queue=${queueName}, key=${redisKey}: ${err.message}`,
              err,
            );
            cb(err);
          } else {
            this.logger.debug(`ZCARD operation completed, count=${count}`);
            this.logger.debug(
              `Completed count operation for queue=${queueName}, key=${redisKey}, count=${count}`,
            );
            cb(null, count);
          }
        });
      }
    });
  }

  /**
   * Fetch items from a Redis sorted set with pagination
   *
   * @param queue - Queue parameters
   * @param redisKey - Redis key for the specific queue type
   * @param offset - Start index (zero-based)
   * @param limit - Number of items to fetch
   * @param cb - Callback function
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

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Redis client error during fetchItems operation: ${err.message}`,
          err,
        );
        cb(err);
      } else if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client error during fetchItems operation: ${error.message}`,
          error,
        );
        cb(error);
      } else {
        const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
        const key = keys[redisKey];
        const endIndex = offset + limit - 1;

        this.logger.debug(
          `Executing ZRANGE on ${key} from ${offset} to ${endIndex}`,
        );

        client.zrange(key, offset, endIndex, (err, items) => {
          if (err) {
            this.logger.error(
              `Error in fetchItems operation for queue=${queueName}, key=${redisKey}: ${err.message}`,
              err,
            );
            cb(err);
          } else {
            const itemCount = items ? items.length : 0;
            this.logger.debug(
              `ZRANGE operation completed, retrieved ${itemCount} items`,
            );

            if (itemCount === 0) {
              this.logger.debug(
                `No items found in range [${offset}, ${endIndex}] for ${key}`,
              );
            } else if (itemCount < limit) {
              this.logger.debug(
                `Partial result: requested ${limit} items but found only ${itemCount} items`,
              );
            }

            this.logger.debug(
              `Completed fetchItems operation for queue=${queueName}, key=${redisKey}, items=${itemCount}`,
            );
            cb(null, items || []);
          }
        });
      }
    });
  }

  /**
   * Fetch all items from a Redis sorted set using ZSCAN for memory efficiency
   *
   * @param queue - Queue parameters
   * @param redisKey - Redis key for the specific queue type
   * @param cb - Callback function
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

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Redis client error during fetchAllItems operation: ${err.message}`,
          err,
        );
        cb(err);
      } else if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client error during fetchAllItems operation: ${error.message}`,
          error,
        );
        cb(error);
      } else {
        const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
        const key = keys[redisKey];

        this.logger.debug(`Using ZSCAN to retrieve all items from ${key}`);

        // Use recursive ZSCAN to get all items
        const allItems: string[] = [];
        let scanCount = 0;

        const scanRecursive = (cursor: string) => {
          scanCount++;
          this.logger.debug(
            `ZSCAN iteration #${scanCount} with cursor=${cursor} for ${key}`,
          );

          client.zscan(key, cursor, { COUNT: 100 }, (err, result) => {
            if (err) {
              this.logger.error(
                `Error in ZSCAN operation for queue=${queueName}, key=${redisKey}: ${err.message}`,
                err,
              );
              cb(err);
              return;
            }

            if (!result) {
              this.logger.debug(
                `ZSCAN returned no result, returning ${allItems.length} items collected so far`,
              );
              cb(null, allItems);
              return;
            }

            const batchSize = result.items.length;
            allItems.push(...result.items);

            this.logger.debug(
              `ZSCAN batch #${scanCount} retrieved ${batchSize} items, total collected: ${allItems.length}`,
            );

            // If cursor is '0', we've completed the scan
            if (result.cursor === '0') {
              this.logger.debug(
                `ZSCAN completed after ${scanCount} iterations, total items: ${allItems.length}`,
              );
              this.logger.debug(
                `Completed fetchAllItems operation for queue=${queueName}, key=${redisKey}, items=${allItems.length}`,
              );
              cb(null, allItems);
            } else {
              // Continue scanning with the new cursor
              this.logger.debug(
                `ZSCAN continuing with cursor=${result.cursor}`,
              );
              setImmediate(() => scanRecursive(result.cursor));
            }
          });
        };

        // Start scanning from cursor 0
        this.logger.debug(`Starting ZSCAN with initial cursor=0`);
        scanRecursive('0');
      }
    });
  }
}
