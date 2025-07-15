/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, ILogger, logger } from 'redis-smq-common';
import { RedisClient } from '../../redis-client/redis-client.js';
import { Configuration } from '../../../config/index.js';

/**
 * Abstract class for queue message storage operations
 * Provides a common interface for different Redis data structures (lists, sets, etc.)
 */
export abstract class QueueStorage {
  protected redisClient;
  protected logger: ILogger;

  /**
   * @param redisClient Redis client instance
   */
  protected constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );
  }

  /**
   * Count items in the storage
   *
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  abstract count(redisKey: string, cb: ICallback<number>): void;

  /**
   * Fetch items from the storage with pagination
   *
   * @param redisKey Redis key for the specific queue type
   * @param pageParams Pagination parameters
   * @param cb Callback function
   */
  abstract fetchItems(
    redisKey: string,
    pageParams: {
      page: number;
      pageSize: number;
      offsetStart: number;
      offsetEnd: number;
    },
    cb: ICallback<string[]>,
  ): void;

  /**
   * Fetch all items from the storage
   *
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  abstract fetchAllItems(redisKey: string, cb: ICallback<string[]>): void;
}
