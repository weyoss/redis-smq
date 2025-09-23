/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { createLogger, ICallback } from 'redis-smq-common';
import { Configuration } from '../config/index.js';
import { IQueueParams } from '../queue-manager/index.js';
import { IExchange } from './types/exchange.js';

export abstract class ExchangeAbstract<ExchangeParams>
  implements IExchange<ExchangeParams>
{
  protected logger;

  constructor() {
    this.logger = createLogger(
      Configuration.getConfig().logger,
      this.constructor.name.toLowerCase(),
    );
  }

  abstract getQueues(
    exchangeParams: ExchangeParams,
    cb: ICallback<IQueueParams[]>,
  ): void;
}
