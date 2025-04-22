/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
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
   * @param redisKey - Redis key for the specific queue type
   * @param cb - Callback function
   */
  count(redisKey: string, cb: ICallback<number>): void {
    this.logger.debug(`Starting count operation for key=${redisKey}`);

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
        this.logger.debug(`Executing ZCARD on ${redisKey}`);

        client.zcard(redisKey, (err, count) => {
          if (err) {
            this.logger.error(
              `Error in count operation for key=${redisKey}: ${err.message}`,
              err,
            );
            cb(err);
          } else {
            this.logger.debug(`ZCARD operation completed, count=${count}`);
            this.logger.debug(
              `Completed count operation for key=${redisKey}, count=${count}`,
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
   * @param redisKey - Redis key for the specific queue type
   * @param pageParams
   * @param cb - Callback function
   */
  fetchItems(
    redisKey: string,
    pageParams: {
      page?: number;
      pageSize?: number;
      offsetStart: number;
      offsetEnd: number;
    },
    cb: ICallback<string[]>,
  ): void {
    const { offsetStart, offsetEnd } = pageParams;
    this.logger.debug(
      `Starting fetchItems operation for key=${redisKey}, start=${offsetStart}, stop=${offsetEnd}`,
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
        this.logger.debug(
          `Executing ZRANGE on ${redisKey} from ${offsetStart} to ${offsetEnd}`,
        );

        client.zrange(redisKey, offsetStart, offsetEnd, (err, items) => {
          if (err) {
            this.logger.error(
              `Error in fetchItems operation for key=${redisKey}: ${err.message}`,
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
                `No items found in range [${offsetStart}, ${offsetEnd}] for ${redisKey}`,
              );
            }

            this.logger.debug(
              `Completed fetchItems operation for key=${redisKey}, items=${itemCount}`,
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
   * @param redisKey - Redis key for the specific queue type
   * @param cb - Callback function
   */
  fetchAllItems(redisKey: string, cb: ICallback<string[]>): void {
    this.logger.debug(`Starting fetchAllItems operation for key=${redisKey}`);

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
        this.logger.debug(`Using ZSCAN to retrieve all items from ${redisKey}`);

        // Use recursive ZSCAN to get all items
        const allItems: string[] = [];
        let scanCount = 0;

        const scanRecursive = (cursor: string) => {
          scanCount++;
          this.logger.debug(
            `ZSCAN iteration #${scanCount} with cursor=${cursor} for ${redisKey}`,
          );

          client.zscan(redisKey, cursor, { COUNT: 100 }, (err, result) => {
            if (err) {
              this.logger.error(
                `Error in ZSCAN operation for key=${redisKey}: ${err.message}`,
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
                `Completed fetchAllItems operation for key=${redisKey}, items=${allItems.length}`,
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
