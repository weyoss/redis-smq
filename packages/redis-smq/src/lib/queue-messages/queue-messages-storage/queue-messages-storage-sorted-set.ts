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
 * Implementation of QueueMessagesStorage for Redis sorted sets.
 * Provides specialized methods for working with sorted sets in Redis
 * for queue message storage operations.
 */
export class QueueMessagesStorageSortedSet extends QueueMessagesStorage {
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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
        client.zcard(keys[redisKey], cb);
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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
        client.zrange(
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
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);

        // Use recursive ZSCAN to get all items
        const allItems: string[] = [];
        const scanRecursive = (cursor: string) => {
          client.zscan(
            keys[redisKey],
            cursor,
            { COUNT: 100 },
            (err, result) => {
              if (err) {
                cb(err);
                return;
              }

              if (!result) {
                cb(null, allItems);
                return;
              }

              allItems.push(...result.items);

              // If cursor is '0', we've completed the scan
              if (result.cursor === '0') {
                cb(null, allItems);
              } else {
                // Continue scanning with the new cursor
                setImmediate(() => scanRecursive(result.cursor));
              }
            },
          );
        };

        // Start scanning from cursor 0
        scanRecursive('0');
      }
    });
  }
}
