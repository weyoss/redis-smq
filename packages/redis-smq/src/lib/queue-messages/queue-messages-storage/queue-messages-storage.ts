/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, ILogger, logger } from 'redis-smq-common';
import { RedisClient } from '../../../common/redis-client/redis-client.js';
import { redisKeys } from '../../../common/redis-keys/redis-keys.js';
import { Configuration } from '../../../config/index.js';
import { IQueueParsedParams } from '../../queue/index.js';

/**
 * Abstract class for queue message storage operations
 * Provides a common interface for different Redis data structures (lists, sets, etc.)
 */
export abstract class QueueMessagesStorage {
  protected redisClient;
  protected logger: ILogger;

  /**
   * @param redisClient Redis client instance
   */
  constructor(redisClient: RedisClient) {
    this.redisClient = redisClient;
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );
  }

  /**
   * Count items in the storage
   *
   * @param queue Queue parameters
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  abstract count(
    queue: IQueueParsedParams,
    redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
    cb: ICallback<number>,
  ): void;

  /**
   * Fetch items from the storage with pagination
   *
   * @param queue Queue parameters
   * @param redisKey Redis key for the specific queue type
   * @param offset Start index
   * @param limit Number of items to fetch
   * @param cb Callback function
   */
  abstract fetchItems(
    queue: IQueueParsedParams,
    redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
    offset: number,
    limit: number,
    cb: ICallback<string[]>,
  ): void;

  /**
   * Fetch all items from the storage
   *
   * @param queue Queue parameters
   * @param redisKey Redis key for the specific queue type
   * @param cb Callback function
   */
  abstract fetchAllItems(
    queue: IQueueParsedParams,
    redisKey: keyof ReturnType<typeof redisKeys.getQueueKeys>,
    cb: ICallback<string[]>,
  ): void;
}
