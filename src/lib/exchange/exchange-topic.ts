/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Exchange } from './exchange';
import {
  EExchangeType,
  TExchangeTopicExchangeBindingParams,
  IQueueParams,
  TTopicParams,
} from '../../../types';
import { CallbackEmptyReplyError, ICallback } from 'redis-smq-common';
import { _getTopicExchangeQueues } from './_get-topic-exchange-queues';
import { _getTopicExchangeParams } from './_get-topic-exchange-params';
import { _getCommonRedisClient } from '../../common/_get-common-redis-client';

export class ExchangeTopic extends Exchange<
  TExchangeTopicExchangeBindingParams,
  EExchangeType.TOPIC
> {
  constructor(queue: TExchangeTopicExchangeBindingParams) {
    super(queue, EExchangeType.TOPIC);
  }

  protected override validateBindingParams(
    topicParams: TExchangeTopicExchangeBindingParams,
  ): TTopicParams {
    return _getTopicExchangeParams(topicParams);
  }

  getQueues(cb: ICallback<IQueueParams[]>): void {
    _getCommonRedisClient((err, client) => {
      if (err) cb(err);
      else if (!client) cb(new CallbackEmptyReplyError());
      else _getTopicExchangeQueues(client, this.bindingParams, cb);
    });
  }
}
