/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, async, withRedisClient } from 'redis-smq-common';
import { QueueMessagesStorage } from './queue-messages-storage.js';
import { RedisClient } from '../../../common/redis-client/redis-client.js';

/**
 * Implementation of QueueMessagesStorage for Redis sets.
 * Key Redis commands used: SCARD, SSCAN
 *
 * @remarks
 * Since Redis sets are unordered, pagination is implemented using cursor-based
 * scanning rather than direct indexing.
 */
export class QueueMessagesStorageSet extends QueueMessagesStorage {
  constructor(redisClient: RedisClient) {
    super(redisClient);
    this.logger.debug(`${this.constructor.name} initialized`);
  }

  /**
   * Counts the total number of items in a Redis set.
   *
   * Uses the SCARD command to get the cardinality (number of elements) of the set.
   * This is an O(1) operation in Redis regardless of the set size.
   *
   * @param redisKey - Redis key for the specific queue type
   * @param cb - Callback function that receives the count or an error
   * @returns void
   */
  count(redisKey: string, cb: ICallback<number>): void {
    this.logger.debug(`Counting items in ${redisKey}`);
    withRedisClient(
      this.redisClient,
      (client, cb) => {
        this.logger.debug(`Executing SCARD on ${redisKey}`);

        client.scard(redisKey, (err, reply) => {
          if (err) {
            this.logger.error(`SCARD failed for ${redisKey}: ${err.message}`);
            return cb(err);
          }

          this.logger.debug(`${redisKey} contains ${reply} items`);
          cb(null, reply);
        });
      },
      cb,
    );
  }

  /**
   * Fetches a subset of items from a Redis set with pagination.
   *
   * Since Redis sets are unordered, this method uses SSCAN with pagination
   * to retrieve items page by page. It scans through the set until it reaches
   * the requested page.
   *
   * @param redisKey - Redis key for the specific queue type
   * @param pageParams - Pagination parameters
   * @param pageParams.page - Page number (1-based) for pagination
   * @param pageParams.pageSize - Number of items per page
   * @param pageParams.offsetStart - Optional start index (not used for sets)
   * @param pageParams.offsetEnd - Optional end index (not used for sets)
   * @param cb - Callback function that receives the items or an error
   * @returns void
   *
   * @remarks
   * The implementation uses cursor-based pagination with SSCAN rather than
   * index-based pagination since Redis sets are unordered collections.
   */
  fetchItems(
    redisKey: string,
    pageParams: {
      page: number;
      pageSize: number;
      offsetStart?: number;
      offsetEnd?: number;
    },
    cb: ICallback<string[]>,
  ): void {
    const { page, pageSize } = pageParams;
    this.logger.debug(
      `Fetching items from ${redisKey} (page ${page}, size ${pageSize})`,
    );

    withRedisClient(
      this.redisClient,
      (client, cb) => {
        /**
         * Recursively scans through the set until reaching the target page.
         *
         * @param cursor - Redis cursor for SSCAN (start with "0" for first call)
         * @param currentPage - Current page being processed (1-based)
         * @param cb - Callback function that receives the scan result or an error
         * @returns void
         */
        const scanToPage = (
          cursor: string,
          currentPage: number,
          cb: ICallback<{ cursor: string; items: string[] }>,
        ): void => {
          this.logger.debug(
            `SSCAN ${redisKey} with cursor ${cursor}, targeting page ${page}, currently at ${currentPage}`,
          );
          async.withCallback(
            (cb: ICallback<{ cursor: string; items: string[] }>) =>
              client.sscan(redisKey, cursor, { COUNT: pageSize }, cb),
            (reply, cb) => {
              // If we've reached the target page, return the items
              if (currentPage == page) {
                this.logger.debug(
                  `Reached target page ${page}, items: ${reply.items.length}`,
                );
                return cb(null, reply);
              }

              // If we've reached the end of the set but haven't reached the requested page
              if (reply.cursor === '0') {
                this.logger.debug(
                  `End of set reached at page ${currentPage}, target was ${page}`,
                );
                return cb(null, { cursor, items: [] });
              }

              // Continue to the next page
              this.logger.debug(`Moving to next page, cursor: ${reply.cursor}`);
              currentPage = currentPage + 1;
              scanToPage(reply.cursor, currentPage, cb);
            },
            cb,
          );
        };

        // Start scanning from the beginning with cursor "0" and page 1
        scanToPage('0', 1, (err, reply) => {
          if (err) {
            this.logger.error(
              `Error fetching items from ${redisKey}: ${err.message}`,
            );
            return cb(err);
          }

          const { items = [] } = reply ?? {};
          const itemCount = items.length;

          if (itemCount === 0) {
            this.logger.debug(`No items found in ${redisKey} for page ${page}`);
          } else {
            this.logger.debug(`Retrieved ${itemCount} items from ${redisKey}`);
          }

          cb(null, items);
        });
      },
      cb,
    );
  }

  /**
   * Fetches all items from a Redis set.
   *
   * Uses SSCAN to efficiently retrieve all items from the set without
   * blocking the Redis server. This approach is more memory-efficient
   * than using SMEMBERS for large sets.
   *
   * @param redisKey - Redis key for the specific queue type
   * @param cb - Callback function that receives all items or an error
   * @returns void
   *
   * @remarks
   * This method uses a Set data structure to ensure uniqueness of items
   * as it collects them from multiple SSCAN operations.
   *
   * For very large sets, this operation may take significant time as it
   * needs to scan through all elements. The implementation uses recursive
   * scanning with cursor to process the set in batches.
   */
  fetchAllItems(redisKey: string, cb: ICallback<string[]>): void {
    this.logger.debug(`Fetching all items from ${redisKey}`);

    withRedisClient(
      this.redisClient,
      (client, cb) => {
        // Use a Set to ensure uniqueness of items
        const items = new Set<string>();
        let scanCount = 0;

        /**
         * Recursively scans through the entire set using cursor-based iteration.
         *
         * This function implements an incremental scanning approach using Redis SSCAN.
         * It collects items batch by batch using a cursor-based iteration, which is
         * memory-efficient and non-blocking for the Redis server.
         *
         * @param cursor - Redis cursor for SSCAN (start with "0" for first call)
         * @param cb - Callback function called when scanning is complete or on error
         * @returns void
         */
        const fullScan = (cursor: string, cb: ICallback<void>): void => {
          scanCount++;
          this.logger.debug(
            `SSCAN ${redisKey} iteration ${scanCount}, cursor: ${cursor}`,
          );
          async.withCallback(
            (cb: ICallback<{ cursor: string; items: string[] }>) =>
              client.sscan(redisKey, cursor, {}, cb),
            (reply, cb) => {
              const newItems = reply.items.length;
              this.logger.debug(
                `Adding ${newItems} items from scan iteration ${scanCount}`,
              );

              // Add all items to the Set (duplicates are automatically handled)
              reply.items.forEach((i) => items.add(i));

              // If cursor is '0', we've completed the scan
              if (reply.cursor === '0') {
                this.logger.debug(
                  `Scan complete after ${scanCount} iterations`,
                );
                return cb();
              }

              // Continue scanning with the new cursor
              fullScan(reply.cursor, cb);
            },
            cb,
          );
        };

        this.logger.debug(`Starting SSCAN with initial cursor=0`);

        // Start scanning from cursor "0"
        fullScan('0', (err) => {
          if (err) {
            this.logger.error(
              `Error fetching all items from ${redisKey}: ${err.message}`,
            );
            return cb(err);
          }

          const itemCount = items.size;

          if (itemCount === 0) {
            this.logger.debug(`${redisKey} is empty`);
          } else {
            this.logger.debug(
              `Retrieved ${itemCount} total items from ${redisKey}`,
            );
          }

          // Convert Set to array for the callback
          cb(null, [...items.values()]);
        });
      },
      cb,
    );
  }
}
