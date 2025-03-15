/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ExchangeFanOut, IQueueParams } from 'redis-smq';

const { promisifyAll } = bluebird;

export class ExchangeFanOutService {
  protected exchangeFanOut;

  constructor(exchangeFanOut: ExchangeFanOut) {
    this.exchangeFanOut = promisifyAll(exchangeFanOut);
  }

  async getAllExchanges(queueParams?: IQueueParams) {
    if (queueParams) {
      const r = await this.exchangeFanOut.getQueueExchangeAsync(queueParams);
      return r ? [r] : [];
    }
    return this.exchangeFanOut.getAllExchangesAsync();
  }

  async saveExchange(fanOutName: string) {
    await this.exchangeFanOut.saveExchangeAsync(fanOutName);
  }

  async bindQueue(queueParams: IQueueParams, fanOutName: string) {
    await this.exchangeFanOut.bindQueueAsync(queueParams, fanOutName);
  }

  async getQueues(fanOutName: string) {
    return this.exchangeFanOut.getQueuesAsync(fanOutName);
  }
}
