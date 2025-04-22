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
 * Implementation of QueueMessagesStorage for Redis lists
 */
export class QueueMessagesStorageList extends QueueMessagesStorage {
  /**
   * @param redisClient Redis client instance
   */
  constructor(redisClient: RedisClient) {
    super(redisClient);
    this.logger.debug('QueueMessagesStorageList initialized');
  }

  /**
   * Count items in a Redis list
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  count(redisKey: string, cb: ICallback<number>): void {
    this.logger.debug(`Counting items in list ${redisKey}`);

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(`Failed to get Redis client: ${err.message}`);
        cb(err);
      } else if (!client) {
        this.logger.error('Redis client is empty');
        cb(new CallbackEmptyReplyError());
      } else {
        this.logger.debug(`Executing LLEN on ${redisKey}`);
        client.llen(redisKey, (err, count) => {
          if (err) {
            this.logger.error(`LLEN operation failed: ${err.message}`);
            cb(err);
          } else {
            this.logger.debug(`Count for ${redisKey}: ${count}`);
            cb(null, count);
          }
        });
      }
    });
  }

  /**
   * Fetch items from a Redis list with pagination
   *
   * @param redisKey Redis key for the specific queue type
   * @param pageParams
   * @param cb
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
      `Fetching items from ${redisKey} with start=${offsetStart}, stop=${offsetEnd}`,
    );

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(`Failed to get Redis client: ${err.message}`);
        cb(err);
      } else if (!client) {
        this.logger.error('Redis client is empty');
        cb(new CallbackEmptyReplyError());
      } else {
        this.logger.debug(
          `Executing LRANGE on ${redisKey} from ${offsetStart} to ${offsetEnd}`,
        );
        client.lrange(redisKey, offsetStart, offsetEnd, (err, items) => {
          if (err) {
            this.logger.error(`LRANGE operation failed: ${err.message}`);
            cb(err);
          } else {
            const itemCount = items ? items.length : 0;
            this.logger.debug(`Retrieved ${itemCount} items from ${redisKey}`);
            cb(null, items || []);
          }
        });
      }
    });
  }

  /**
   * Fetch all items from a Redis list
   *
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  fetchAllItems(redisKey: string, cb: ICallback<string[]>): void {
    const chunkSize = 100;
    this.logger.debug(`Fetching all items with chunk size ${chunkSize}`);

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(`Failed to get Redis client: ${err.message}`);
        cb(err);
      } else if (!client) {
        this.logger.error('Redis client is empty');
        cb(new CallbackEmptyReplyError());
      } else {
        this.logger.debug(`Fetching all items from ${redisKey}`);

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
          this.logger.debug(`Total length of ${redisKey}: ${totalLength}`);

          if (totalLength === 0) {
            this.logger.debug(
              `List ${redisKey} is empty, returning empty array`,
            );
            return cb(null, []);
          }

          const allItems: string[] = [];
          const totalChunks = Math.ceil(totalLength / chunkSize);
          this.logger.debug(
            `Will process ${totalChunks} chunks for list ${redisKey}`,
          );

          // Process chunks recursively with non-blocking approach
          const processChunk = (
            offset: number,
            chunkIndex: number = 1,
          ): void => {
            // If we've processed all items, we're done
            if (offset >= totalLength) {
              this.logger.debug(
                `Completed fetching all ${allItems.length} items from ${redisKey}`,
              );
              return cb(null, allItems);
            }

            // Calculate end index for this chunk
            const end = Math.min(offset + chunkSize - 1, totalLength - 1);
            this.logger.debug(
              `Processing chunk ${chunkIndex}/${totalChunks} (offset: ${offset}, end: ${end})`,
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
                  `No items in chunk ${chunkIndex}, returning ${allItems.length} items collected so far`,
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
      }
    });
  }
}
