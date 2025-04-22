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
 * Key Redis commands used: ZCARD, ZRANGE, ZSCAN
 */
export class QueueMessagesStorageSortedSet extends QueueMessagesStorage {
  constructor(redisClient: RedisClient) {
    super(redisClient);
    this.logger.debug(`${this.constructor.name} initialized`);
  }

  /**
   * Counts the total number of items in a Redis sorted set
   *
   * Uses the ZCARD command to get the cardinality (number of elements) of the sorted set.
   * This is an O(1) operation in Redis.
   *
   * @param redisKey - Redis key for the specific queue type
   * @param cb - Callback function that receives the count or an error
   * @returns void
   */
  count(redisKey: string, cb: ICallback<number>): void {
    this.logger.debug(`Counting items in ${redisKey}`);

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(`Redis client error: ${err.message}`);
        return cb(err);
      }
      if (!client) {
        this.logger.error('Redis client is null');
        return cb(new CallbackEmptyReplyError());
      }
      this.logger.debug(`Executing ZCARD on ${redisKey}`);
      client.zcard(redisKey, (err, count) => {
        if (err) {
          this.logger.error(`ZCARD failed for ${redisKey}: ${err.message}`);
          cb(err);
        } else {
          this.logger.debug(`${redisKey} contains ${count} items`);
          cb(null, count);
        }
      });
    });
  }

  /**
   * Fetches a subset of items from a Redis sorted set with pagination
   *
   * Uses ZRANGE to retrieve a range of elements from the sorted set.
   * Elements are ordered by their score from lowest to highest.
   * This is an O(log(N)+M) operation in Redis, where N is the number of elements
   * in the sorted set and M is the number of elements returned.
   *
   * @param redisKey - Redis key for the specific queue type
   * @param pageParams - Pagination parameters
   * @param pageParams.page - Optional page number (not directly used in this implementation)
   * @param pageParams.pageSize - Optional number of items per page (not directly used in this implementation)
   * @param pageParams.offsetStart - Start index for range-based pagination (0-based)
   * @param pageParams.offsetEnd - End index for range-based pagination (inclusive)
   * @param cb - Callback function that receives the items or an error
   * @returns void
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
      `Fetching items from ${redisKey} range [${offsetStart}:${offsetEnd}]`,
    );

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(`Redis client error: ${err.message}`);
        return cb(err);
      }
      if (!client) {
        this.logger.error('Redis client is null');
        return cb(new CallbackEmptyReplyError());
      }
      this.logger.debug(
        `Executing ZRANGE on ${redisKey} from ${offsetStart} to ${offsetEnd}`,
      );
      client.zrange(redisKey, offsetStart, offsetEnd, (err, items) => {
        if (err) {
          this.logger.error(`ZRANGE failed for ${redisKey}: ${err.message}`);
          cb(err);
        } else {
          const itemCount = items ? items.length : 0;

          if (itemCount === 0) {
            this.logger.debug(
              `No items found in ${redisKey} range [${offsetStart}:${offsetEnd}]`,
            );
          } else {
            this.logger.debug(`Retrieved ${itemCount} items from ${redisKey}`);
          }

          cb(null, items || []);
        }
      });
    });
  }

  /**
   * Fetches all items from a Redis sorted set
   *
   * Uses ZSCAN to efficiently retrieve all items from the sorted set without
   * blocking the Redis server. This approach is more memory-efficient
   * than using ZRANGE for large sorted sets, as it processes the data in batches.
   *
   * The ZSCAN command is used to incrementally iterate over elements, which is
   * safer for production environments with large datasets as it avoids blocking
   * operations.
   *
   * @param redisKey - Redis key for the specific queue type
   * @param cb - Callback function that receives all items or an error
   * @returns void
   */
  fetchAllItems(redisKey: string, cb: ICallback<string[]>): void {
    this.logger.debug(`Fetching all items from ${redisKey} using ZSCAN`);

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(`Redis client error: ${err.message}`);
        return cb(err);
      }

      if (!client) {
        this.logger.error('Redis client is null');
        return cb(new CallbackEmptyReplyError());
      }

      // Using recursive ZSCAN to get all items
      const allItems: string[] = [];
      let scanCount = 0;

      /**
       * Recursively scans through the entire sorted set
       *
       * This function implements an incremental scanning approach using Redis ZSCAN.
       * It collects items batch by batch using a cursor-based iteration, which is
       * memory-efficient and non-blocking for the Redis server.
       *
       * @param cursor - Redis cursor for ZSCAN (start with "0" for first call)
       * @returns void
       */
      const scanRecursive = (cursor: string): void => {
        scanCount++;
        this.logger.debug(
          `ZSCAN iteration ${scanCount} on ${redisKey}, cursor: ${cursor}`,
        );

        client.zscan(redisKey, cursor, { COUNT: 100 }, (err, result) => {
          if (err) {
            this.logger.error(`ZSCAN failed: ${err.message}`);
            return cb(err);
          }

          if (!result) {
            this.logger.error('ZSCAN returned empty result object');
            return cb(new CallbackEmptyReplyError());
          }

          const batchSize = result.items.length;
          allItems.push(...result.items);

          this.logger.debug(
            `ZSCAN batch #${scanCount} retrieved ${batchSize} items, total collected: ${allItems.length}`,
          );

          // If cursor is '0', we've completed the scan
          if (result.cursor === '0') {
            this.logger.debug(
              `ZSCAN complete, collected ${allItems.length} items in ${scanCount} iterations`,
            );
            return cb(null, allItems);
          }

          // Continue scanning with the new cursor
          // Using setImmediate to avoid blocking the event loop and prevent stack overflow
          // for large datasets that might require many recursive calls
          this.logger.debug(`ZSCAN continuing with cursor=${result.cursor}`);
          setImmediate(() => scanRecursive(result.cursor));
        });
      };

      // Start scanning from cursor 0
      this.logger.debug(`Starting ZSCAN with initial cursor=0`);
      scanRecursive('0');
    });
  }
}
