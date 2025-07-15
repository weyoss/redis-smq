/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, logger } from 'redis-smq-common';
import { RedisClient } from '../common/redis-client/redis-client.js';
import { Configuration } from '../config/index.js';
import { IQueueParams } from '../queue/index.js';
import { IExchange } from './types/exchange.js';

export abstract class ExchangeAbstract<ExchangeParams>
  implements IExchange<ExchangeParams>
{
  protected logger;
  protected redisClient: RedisClient;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      this.constructor.name.toLowerCase(),
    );
    this.redisClient = new RedisClient();
    this.redisClient.on('error', (err) => this.logger.error(err));
  }

  abstract getQueues(
    exchangeParams: ExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;

  shutdown = (cb: ICallback<void>): void => {
    this.redisClient.shutdown(cb);
  };
}
