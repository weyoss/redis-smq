import { Exchange } from './exchange';
import {
  EExchangeType,
  TExchangeTopicExchangeBindingParams,
  IQueueParams,
  TTopicParams,
} from '../../../types';
import { errors, ICallback } from 'redis-smq-common';
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
      else if (!client) cb(new errors.EmptyCallbackReplyError());
      else _getTopicExchangeQueues(client, this.bindingParams, cb);
    });
  }
}