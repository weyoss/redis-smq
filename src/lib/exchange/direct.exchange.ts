import { Exchange } from './exchange';
import {
  EMessageExchange,
  IRequiredConfig,
  IMessageExchangeDirect,
  TQueueParams,
} from '../../../types';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { Queue } from '../queue-manager/queue';

export class DirectExchange extends Exchange {
  protected queue: TQueueParams | string;

  constructor(queue: TQueueParams | string) {
    super();
    this.queue =
      typeof queue === 'string'
        ? redisKeys.validateRedisKey(queue)
        : {
            name: redisKeys.validateRedisKey(queue.name),
            ns: redisKeys.validateNamespace(queue.ns),
          };
    return this;
  }

  getQueue(): TQueueParams | string {
    return this.queue;
  }

  getQueues(
    redisClient: RedisClient,
    config: IRequiredConfig,
    cb: ICallback<TQueueParams[]>,
  ): void {
    const queue = Queue.getParams(config, this.queue);
    cb(null, [queue]);
  }

  override toJSON(): IMessageExchangeDirect {
    return {
      ...super.toJSON(),
      type: EMessageExchange.DIRECT,
      queue: this.queue,
    };
  }

  static createInstanceFrom(json: Record<string, any>): DirectExchange {
    const queue = json['queue'];
    const e = new DirectExchange(queue);
    e.populate(json);
    return e;
  }
}
