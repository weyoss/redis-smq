/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createLogger, ICallback, ILogger } from 'redis-smq-common';
import { Configuration } from '../../../config/index.js';

export interface IBrowserStorage {
  count(redisKey: string, cb: ICallback<number>): void;
  fetchItems(
    redisKey: string,
    options: {
      page: number;
      pageSize: number;
      offsetStart: number;
      offsetEnd: number;
    },
    cb: ICallback<string[]>,
  ): void;
  fetchAllItems(redisKey: string, cb: ICallback<string[]>): void;
}

/**
 * Abstract class for queue message storage operations
 * Provides a common interface for different Redis data structures (lists, sets, etc.)
 */
export abstract class BrowserStorageAbstract implements IBrowserStorage {
  protected logger: ILogger;

  constructor(logger?: ILogger) {
    this.logger = logger
      ? logger.createLogger(this.constructor.name)
      : createLogger(Configuration.getConfig().logger, this.constructor.name);
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
