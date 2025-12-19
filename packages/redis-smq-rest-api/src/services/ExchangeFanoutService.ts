/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ExchangeFanout, IExchangeParams, IQueueParams } from 'redis-smq';

const { promisifyAll } = bluebird;

export class ExchangeFanoutService {
  protected exchangeFanout;

  constructor(exchangeFanout: ExchangeFanout) {
    this.exchangeFanout = promisifyAll(exchangeFanout);
  }

  async bindQueue(queueParams: IQueueParams, fanoutParams: IExchangeParams) {
    await this.exchangeFanout.bindQueueAsync(queueParams, fanoutParams);
  }

  async unbindQueue(queueParams: IQueueParams, fanoutParams: IExchangeParams) {
    await this.exchangeFanout.unbindQueueAsync(queueParams, fanoutParams);
  }

  async matchQueues(fanoutParams: IExchangeParams) {
    return this.exchangeFanout.matchQueuesAsync(fanoutParams);
  }

  async deleteExchange(fanoutParams: IExchangeParams) {
    return this.exchangeFanout.deleteAsync(fanoutParams);
  }
}
