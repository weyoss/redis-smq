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
 * Implementation of QueueMessagesStorage for Redis sets.
 * Provides specialized methods for working with sets in Redis
 * for queue message storage operations.
 */
export class QueueMessagesStorageSet extends QueueMessagesStorage {
  /**
   * Count items in a Redis set
   *
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
        client.scard(keys[redisKey], (err, reply) => {
          if (err) cb(err);
          else if (!reply) cb(new CallbackEmptyReplyError());
          else cb(null, reply);
        });
      }
    });
  }

  /**
   * Fetch items from a Redis set with pagination
   *
   * Note: Sets are unordered, so this uses SSCAN with a count hint
   *
   * @param queue - Queue parameters
   * @param redisKey - Redis key for the specific queue type
   * @param offset - Start index (used as a cursor)
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
    const keys = redisKeys.getQueueKeys(queue.queueParams, queue.groupId);
    this.redisClient.getSetInstance((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else {
        client.sscan(
          keys[redisKey],
          offset.toString(),
          { COUNT: limit },
          (err, reply) => {
            if (err) cb(err);
            else if (!reply) cb(new CallbackEmptyReplyError());
            else cb(null, reply ? reply.items : []);
          },
        );
      }
    });
  }

  /**
   * Fetch all items from a Redis set using SSCAN for memory efficiency
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
        client.sscanAll(keys[redisKey], { COUNT: 100 }, cb);
      }
    });
  }
}
