import { Exchange } from './exchange';
import {
  EMessageExchange,
  IRequiredConfig,
  IMessageExchangeTopic,
  TQueueParams,
  TTopicParams,
} from '../../../types';
import { async, RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { Queue } from '../queue-manager/queue';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { InvalidTopicError } from './errors/invalid-topic.error';

export class TopicExchange extends Exchange {
  protected type = EMessageExchange.TOPIC;
  protected topic: TTopicParams | string;

  constructor(topic: string | TTopicParams) {
    super();
    this.topic = topic;
  }

  protected validateTopicName(topic: string): string {
    const lowerCase = topic.toLowerCase();
    if (!/^[a-z0-9]+([-_.]?[a-z0-9]+)*$/.test(lowerCase))
      throw new InvalidTopicError();
    return lowerCase;
  }

  matchQueues(
    config: IRequiredConfig,
    queues: TQueueParams[],
    cb: ICallback<TQueueParams[]>,
  ): void {
    const topicParams = this.getNamespacedTopic(config);
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

  getTopic(): TTopicParams | string {
    return this.topic;
  }

  getNamespacedTopic(config: IRequiredConfig): TTopicParams {
    const topicParams: { topic: string; ns?: string } =
      typeof this.topic === 'string' ? { topic: this.topic } : this.topic;
    const topic = this.validateTopicName(topicParams.topic);
    const ns = topicParams.ns
      ? redisKeys.validateNamespace(topicParams.ns)
      : config.namespace;
    return {
      topic,
      ns,
    };
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

  override toJSON(): IMessageExchangeTopic {
    return {
      ...super.toJSON(),
      type: EMessageExchange.TOPIC,
      topic: this.topic,
    };
  }

  static createInstanceFrom(json: Record<string, any>): TopicExchange {
    const topic = String(json['topic']);
    const e = new TopicExchange(topic);
    e.populate(json);
    return e;
  }
}
