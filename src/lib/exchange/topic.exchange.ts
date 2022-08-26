import { Exchange } from './exchange';
import {
  EExchangeType,
  ITopicExchangeParams,
  IRequiredConfig,
  TQueueParams,
  TTopicParams,
} from '../../../types';
import { async, RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { Queue } from '../queue-manager/queue';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { ExchangeError } from './errors/exchange.error';

export class TopicExchange extends Exchange<
  TTopicParams | string,
  EExchangeType.TOPIC
> {
  constructor(topic: TTopicParams | string) {
    super(topic, EExchangeType.TOPIC);
  }

  protected override validateBindingParams(
    topicParams: TTopicParams | string,
  ): TTopicParams | string {
    return typeof topicParams === 'string'
      ? redisKeys.validateRedisKey(topicParams)
      : {
          topic: redisKeys.validateRedisKey(topicParams.topic),
          ns: redisKeys.validateNamespace(topicParams.ns),
        };
  }

  protected getTopicParams(config: IRequiredConfig): TTopicParams {
    if (typeof this.bindingParams === 'string') {
      return {
        topic: this.bindingParams,
        ns: config.namespace,
      };
    }
    return this.bindingParams;
  }

  matchQueues(
    config: IRequiredConfig,
    queues: TQueueParams[],
    cb: ICallback<TQueueParams[]>,
  ): void {
    const topicParams = this.getTopicParams(config);
    const matched: TQueueParams[] = [];
    const regExp = new RegExp(topicParams.topic);
    async.eachOf(
      queues,
      (queue, index, done) => {
        if (queue.ns === topicParams.ns && regExp.test(queue.name))
          matched.push(queue);
        done();
      },
      (err) => {
        if (err) cb(err);
        else cb(null, matched);
      },
    );
  }

  getQueues(
    redisClient: RedisClient,
    config: IRequiredConfig,
    cb: ICallback<TQueueParams[]>,
  ): void {
    Queue.list(redisClient, (err, reply) => {
      if (err) cb(err);
      else this.matchQueues(config, reply ?? [], cb);
    });
  }

  static fromJSON(json: Partial<ITopicExchangeParams>): TopicExchange {
    if (!json.bindingParams)
      throw new ExchangeError('Binding params are required.');
    const e = new TopicExchange(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
}
