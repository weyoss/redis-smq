/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from 'redis-smq-common';
import { QueueStorageAbstract } from './queue-storage-abstract.js';
import { withSharedPoolConnection } from '../../redis-connection-pool/with-shared-pool-connection.js';

/**
 * Implementation of QueueStorageAbstract for Redis lists
 */
export class QueueStorageList extends QueueStorageAbstract {
  /**
   * Counts the number of items in a Redis list
   *
   * Uses the Redis LLEN command to get the length of the list identified by the provided key.
   *
   * @param redisKey - Redis key identifying the list to count items from
   * @param cb - Callback function that receives the count or an error
   * @returns void - Results are returned via callback with (error, count)
   */
  count(redisKey: string, cb: ICallback<number>): void {
    this.logger.debug(`Counting items in list ${redisKey}`);

    withSharedPoolConnection((client, cb) => {
      this.logger.debug(`Executing LLEN on ${redisKey}`);
      client.llen(redisKey, (err, count) => {
        if (err) {
          this.logger.error(`LLEN failed for ${redisKey}: ${err.message}`);
          return cb(err);
        }

        this.logger.debug(`${redisKey} contains ${count} items`);
        return cb(null, count);
      });
    }, cb);
  }

  /**
   * Fetches a range of items from a Redis list with pagination support
   *
   * Uses the Redis LRANGE command to retrieve a subset of elements from the list.
   *
   * @param redisKey - Redis key identifying the list to fetch items from
   * @param pageParams - Pagination parameters object
   * @param pageParams.page - Optional page number (for logging/tracking purposes)
   * @param pageParams.pageSize - Optional page size (for logging/tracking purposes)
   * @param pageParams.offsetStart - Zero-based index of the first element to retrieve
   * @param pageParams.offsetEnd - Zero-based index of the last element to retrieve
   * @param cb - Callback function that receives the items or an error
   * @returns void - Results are returned via callback with (error, items)
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

    withSharedPoolConnection((client, cb) => {
      client.lrange(redisKey, offsetStart, offsetEnd, (err, items) => {
        if (err) {
          this.logger.error(`LRANGE operation failed: ${err.message}`);
          return cb(err);
        }

        const itemCount = items ? items.length : 0;
        this.logger.debug(`Got ${itemCount} items from ${redisKey}`);
        return cb(null, items || []);
      });
    }, cb);
  }

  /**
   * Fetches all items from a Redis list using a chunked approach to handle large lists
   *
   * This method retrieves all elements from a Redis list by:
   * 1. Getting the total length of the list
   * 2. Fetching items in chunks to avoid memory issues with large lists
   * 3. Using setImmediate to prevent blocking the event loop during processing
   *
   * @param redisKey - Redis key identifying the list to fetch all items from
   * @param cb - Callback function that receives all items or an error
   * @returns void - Results are returned via callback with (error, allItems)
   */
  fetchAllItems(redisKey: string, cb: ICallback<string[]>): void {
    const chunkSize = 100; // Number of items to fetch in each chunk
    this.logger.debug(`Fetching all items with chunk size ${chunkSize}`);

    withSharedPoolConnection((client, cb) => {
      // First get the list length to determine how many chunks we need
      this.logger.debug(
        `Executing LLEN on ${redisKey} to determine total length`,
      );
      client.llen(redisKey, (err, reply) => {
        if (err) {
          this.logger.error(`LLEN operation failed: ${err.message}`);
          return cb(err);
        }

        const totalLength = Number(reply);
        this.logger.debug(`${redisKey} total length: ${totalLength}`);

        if (totalLength === 0) {
          this.logger.debug(`List ${redisKey} is empty, returning empty array`);
          return cb(null, []);
        }

        const allItems: string[] = [];
        const totalChunks = Math.ceil(totalLength / chunkSize);
        this.logger.debug(
          `Processing ${totalChunks} chunks for list ${redisKey}`,
        );

        /**
         * Processes chunks of the Redis list recursively in a non-blocking way
         *
         * @param offset - Current position in the list
         * @param chunkIndex - Current chunk number (for logging)
         */
        const processChunk = (offset: number, chunkIndex: number = 1): void => {
          // If we've processed all items, we're done
          if (offset >= totalLength) {
            this.logger.debug(
              `Completed all chunks, returning ${allItems.length} items`,
            );
            return cb(null, allItems);
          }

          // Calculate end index for this chunk
          const end = Math.min(offset + chunkSize - 1, totalLength - 1);
          this.logger.debug(
            `Chunk ${chunkIndex}/${totalChunks}: range [${offset}:${end}]`,
          );

          // Fetch the current chunk
          client.lrange(redisKey, offset, end, (err, items) => {
            if (err) {
              this.logger.error(
                `LRANGE operation failed for chunk ${chunkIndex}: ${err.message}`,
              );
              return cb(err);
            }

            if (!items || items.length === 0) {
              this.logger.debug(
                `Chunk ${chunkIndex} is empty, returning ${allItems.length} items`,
              );
              return cb(null, allItems);
            }

            // Add items to our result array
            const chunkItemCount = items.length;
            allItems.push(...items);
            this.logger.debug(
              `Added ${chunkItemCount} items from chunk ${chunkIndex}, total items so far: ${allItems.length}`,
            );

            // Process next chunk with setImmediate to avoid blocking
            setImmediate(() =>
              processChunk(offset + chunkSize, chunkIndex + 1),
            );
          });
        };

        // Start processing from the beginning of the list
        processChunk(0);
      });
    }, cb);
  }
}
