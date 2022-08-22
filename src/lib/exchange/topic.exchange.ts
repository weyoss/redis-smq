import { Exchange } from './exchange';
import {
  EMessageExchange,
  IRequiredConfig,
  IMessageExchangeTopic,
  TQueueParams,
  TTopicParams,
} from '../../../types';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';

export class TopicExchange extends Exchange {
  protected type = EMessageExchange.TOPIC;
  protected topic: TTopicParams | string;

  constructor(topic: string | TTopicParams) {
    super();
    this.topic = topic;
  }

  getTopic(): TTopicParams | string {
    return this.topic;
  }

  //@todo
  getQueues(
    redisClient: RedisClient,
    config: IRequiredConfig,
    cb: ICallback<TQueueParams[]>,
  ): void {
    //
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
