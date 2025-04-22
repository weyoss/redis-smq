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
 * Implementation of QueueMessagesStorage for Redis sets
 */
export class QueueMessagesStorageSet extends QueueMessagesStorage {
  /**
   * @param redisClient Redis client instance
   */
  constructor(redisClient: RedisClient) {
    super(redisClient);
    this.logger.debug(
      'QueueMessagesStorageSet instance created for Redis sets',
    );
  }

  /**
   * Count items in a Redis set
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  count(redisKey: string, cb: ICallback<number>): void {
    this.logger.debug(`Starting count operation for key=${redisKey}`);

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Redis client error during count operation: ${err.message}`,
          err,
        );
        return cb(err);
      } else if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client error during count operation: ${error.message}`,
          error,
        );
        return cb(error);
      }

      this.logger.debug(`Executing SCARD on ${redisKey}`);

      client.scard(redisKey, (err, reply) => {
        if (err) {
          this.logger.error(
            `Error in count operation for key=${redisKey}: ${err.message}`,
            err,
          );
          return cb(err);
        }

        this.logger.debug(`SCARD operation completed, count=${reply}`);
        this.logger.debug(
          `Completed count operation for key=${redisKey}, count=${reply}`,
        );
        cb(null, reply);
      });
    });
  }

  /**
   * Fetch items from a Redis set with pagination
   * @param redisKey Redis key for the specific queue type
   * @param pageParams
   * @param cb Callback function
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
      `Starting fetchItems operation for key=${redisKey}, page=${page}, pageSize=${pageSize}`,
    );

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Redis client error during fetchItems operation: ${err.message}`,
          err,
        );
        return cb(err);
      }
      if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client error during fetchItems operation: ${error.message}`,
          error,
        );
        return cb(error);
      }

      const scanToPage = (
        cursor: string,
        currentPage: number,
        cb: ICallback<{ cursor: string; items: string[] }>,
      ) => {
        client.sscan(redisKey, cursor, { COUNT: pageSize }, (err, reply) => {
          if (err) return cb(err);
          if (!reply) return cb(new CallbackEmptyReplyError());
          if (currentPage == page) {
            return cb(null, reply);
          }

          // If we've reached the end of the set but haven't reached the requested page
          if (reply.cursor === '0') {
            return cb(null, { cursor, items: [] });
          }
          currentPage = currentPage + 1;
          scanToPage(reply.cursor, currentPage, cb);
        });
      };

      scanToPage('0', 1, (err, reply) => {
        if (err) {
          this.logger.error(
            `Error in fetchItems operation for key=${redisKey}: ${err.message}`,
            err,
          );
          return cb(err);
        }
        const { items = [] } = reply ?? {};
        const itemCount = items.length;
        this.logger.debug(
          `SSCAN operation completed, retrieved ${itemCount} items`,
        );

        if (itemCount === 0) {
          this.logger.debug(
            `No items found for key=${redisKey}, page=${page}, pageSize=${pageSize}`,
          );
        }

        this.logger.debug(
          `Completed fetchItems operation for key=${redisKey}, items=${itemCount}`,
        );

        cb(null, items);
      });
    });
  }

  /**
   * Fetch all items from a Redis set
   *
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  fetchAllItems(redisKey: string, cb: ICallback<string[]>): void {
    this.logger.debug(`Starting fetchAllItems operation for key=${redisKey}`);

    this.redisClient.getSetInstance((err, client) => {
      if (err) {
        this.logger.error(
          `Redis client error during fetchAllItems operation: ${err.message}`,
          err,
        );
        return cb(err);
      } else if (!client) {
        const error = new CallbackEmptyReplyError();
        this.logger.error(
          `Redis client error during fetchAllItems operation: ${error.message}`,
          error,
        );
        return cb(error);
      }

      this.logger.debug(`Executing SMEMBERS on ${redisKey}`);

      const items = new Set<string>();
      const fullScan = (cursor: string, cb: ICallback<void>) => {
        client.sscan(redisKey, cursor, {}, (err, reply) => {
          if (err) return cb(err);
          if (!reply) return cb(new CallbackEmptyReplyError());
          reply.items.map((i) => items.add(i));
          if (reply.cursor === '0') {
            return cb();
          }
          fullScan(reply.cursor, cb);
        });
      };

      fullScan('0', (err) => {
        if (err) {
          this.logger.error(
            `Error in fetchItems operation for key=${redisKey}: ${err.message}`,
            err,
          );
          return cb(err);
        }
        const itemCount = items.size;
        this.logger.debug(
          `SSCAN operation completed, retrieved ${itemCount} items`,
        );
        if (itemCount === 0) {
          this.logger.debug(`No items found for key=${redisKey} (fullscan)`);
        }
        this.logger.debug(
          `Completed fetchAllItems operation for key=${redisKey}, items=${itemCount}`,
        );
        cb(null, [...items.values()]);
      });
    });
  }
}
