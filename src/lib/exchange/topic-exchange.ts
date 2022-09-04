import { Exchange } from './exchange';
import {
  EExchangeType,
  IRequiredConfig,
  ITopicExchangeParams,
  TQueueParams,
  TTopicParams,
} from '../../../types';
import { async, RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { Queue } from '../queue-manager/queue';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { InvalidExchangeDataError } from './errors/invalid-exchange-data.error';

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
      (err) => cb(err, matched),
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
    if (!json.bindingParams || json.type !== EExchangeType.TOPIC)
      throw new InvalidExchangeDataError();
    const e = new TopicExchange(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
}
