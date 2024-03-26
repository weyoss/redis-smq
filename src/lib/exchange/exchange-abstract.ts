/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback, logger } from 'redis-smq-common';
import { RedisClientInstance } from '../../common/redis-client/redis-client-instance.js';
import { Configuration } from '../../config/index.js';
import { IQueueParams } from '../queue/index.js';
import { IExchange } from './types/exchange.js';

export abstract class ExchangeAbstract<ExchangeParams>
  implements IExchange<ExchangeParams>
{
  protected logger;
  protected redisClient: RedisClientInstance;

  constructor() {
    this.logger = logger.getLogger(
      Configuration.getSetConfig().logger,
      `exchange`,
    );
    this.redisClient = new RedisClientInstance();
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
