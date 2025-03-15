/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { IQueueParams } from '../../queue/index.js';
import { ExchangeAbstract } from '../exchange-abstract.js';
import { ITopicParams } from '../types/exchange.js';
import { _getTopicExchangeParams } from './_/_get-topic-exchange-params.js';
import { _getTopicExchangeQueues } from './_/_get-topic-exchange-queues.js';

export class ExchangeTopic extends ExchangeAbstract<string | ITopicParams> {
  getQueues(
    exchangeParams: string | ITopicParams,
    cb: ICallback<IQueueParams[]>,
  ): void {
    const topic = _getTopicExchangeParams(exchangeParams);
    if (topic instanceof Error) cb(topic);
    else {
      this.redisClient.getSetInstance((err, client) => {
        if (err) cb(err);
        else if (!client) cb(new CallbackEmptyReplyError());
        else _getTopicExchangeQueues(client, topic, cb);
      });
    }
  }
}
