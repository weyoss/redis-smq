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

/**
 * Implementation of QueueMessagesStorage for Redis lists
 */
export class QueueMessagesStorageList extends QueueMessagesStorage {
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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        client.llen(keys[redisKey], cb);
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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        client.lrange(
          keys[redisKey],
          offset,
          offset + limit - 1,
          (err, items) => {
            if (err) cb(err);
            else cb(null, items || []);
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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
        const key = keys[redisKey];

        // First get the list length to determine how many chunks we need
        client.llen(key, (err, reply) => {
          if (err) return cb(err);

          const totalLength = Number(reply);
          if (totalLength === 0) return cb(null, []);

          const allItems: string[] = [];

          // Process chunks recursively with non-blocking approach
          const processChunk = (offset: number): void => {
            // If we've processed all items, we're done
            if (offset >= totalLength) {
              return cb(null, allItems);
            }

            // Calculate end index for this chunk
            const end = Math.min(offset + chunkSize - 1, totalLength - 1);

            // Fetch the current chunk
            client.lrange(key, offset, end, (err, items) => {
              if (err) return cb(err);

              if (!items || items.length === 0) return cb(null, allItems);

              // Add items to our result array
              allItems.push(...items);

              // Process next chunk with setImmediate to avoid blocking
              setImmediate(() => processChunk(offset + chunkSize));
            });
          };

          // Start processing from the beginning of the list
          processChunk(0);
        });
      }
    });
  }
}
