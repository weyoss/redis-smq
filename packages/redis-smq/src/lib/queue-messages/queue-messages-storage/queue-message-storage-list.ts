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
   * @param queue Queue parameters
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  count(
    queue: IQueueParsedParams,
    redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
    cb: ICallback<number>,
  ): void {
    const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
    this.logger.debug(`Counting items in list ${keys[redisKey]}`);

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(`Failed to get Redis client: ${err.message}`);
        cb(err);
      } else if (!client) {
        this.logger.error('Redis client is empty');
        cb(new CallbackEmptyReplyError());
      } else {
        this.logger.debug(`Executing LLEN on ${keys[redisKey]}`);
        client.llen(keys[redisKey], (err, count) => {
          if (err) {
            this.logger.error(`LLEN operation failed: ${err.message}`);
            cb(err);
          } else {
            this.logger.debug(`Count for ${keys[redisKey]}: ${count}`);
            cb(null, count);
          }
        });
      }
    });
  }

  /**
   * Fetch items from a Redis list with pagination
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
    const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
    this.logger.debug(
      `Fetching items from ${keys[redisKey]} with offset=${offset}, limit=${limit}`,
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
          `Executing LRANGE on ${keys[redisKey]} from ${offset} to ${offset + limit - 1}`,
        );
        client.lrange(
          keys[redisKey],
          offset,
          offset + limit - 1,
          (err, items) => {
            if (err) {
              this.logger.error(`LRANGE operation failed: ${err.message}`);
              cb(err);
            } else {
              const itemCount = items ? items.length : 0;
              this.logger.debug(
                `Retrieved ${itemCount} items from ${keys[redisKey]}`,
              );
              cb(null, items || []);
            }
          },
        );
      }
    });
  }

  /**
   * Fetch all items from a Redis list
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
        const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
        const key = keys[redisKey];
        this.logger.debug(`Fetching all items from ${key}`);

        // First get the list length to determine how many chunks we need
        this.logger.debug(`Executing LLEN on ${key} to determine total length`);
        client.llen(key, (err, reply) => {
          if (err) {
            this.logger.error(`LLEN operation failed: ${err.message}`);
            return cb(err);
          }

          const totalLength = Number(reply);
          this.logger.debug(`Total length of ${key}: ${totalLength}`);

          if (totalLength === 0) {
            this.logger.debug(`List ${key} is empty, returning empty array`);
            return cb(null, []);
          }

          const allItems: string[] = [];
          const totalChunks = Math.ceil(totalLength / chunkSize);
          this.logger.debug(
            `Will process ${totalChunks} chunks for list ${key}`,
          );

          // Process chunks recursively with non-blocking approach
          const processChunk = (
            offset: number,
            chunkIndex: number = 1,
          ): void => {
            // If we've processed all items, we're done
            if (offset >= totalLength) {
              this.logger.debug(
                `Completed fetching all ${allItems.length} items from ${key}`,
              );
              return cb(null, allItems);
            }

            // Calculate end index for this chunk
            const end = Math.min(offset + chunkSize - 1, totalLength - 1);
            this.logger.debug(
              `Processing chunk ${chunkIndex}/${totalChunks} (offset: ${offset}, end: ${end})`,
            );

            // Fetch the current chunk
            client.lrange(key, offset, end, (err, items) => {
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
