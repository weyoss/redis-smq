import { Exchange } from './exchange';
import {
  EExchangeType,
  IDirectExchangeParams,
  IRequiredConfig,
  TQueueParams,
} from '../../../types';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { redisKeys } from '../../common/redis-keys/redis-keys';
import { Queue } from '../queue-manager/queue';
import { ExchangeError } from './errors/exchange.error';

export class DirectExchange extends Exchange<
  TQueueParams | string,
  EExchangeType.DIRECT
> {
  constructor(queue: TQueueParams | string) {
    super(queue, EExchangeType.DIRECT);
  }

  protected override validateBindingParams(
    queue: TQueueParams | string,
  ): TQueueParams | string {
    return typeof queue === 'string'
      ? redisKeys.validateRedisKey(queue)
      : {
          name: redisKeys.validateRedisKey(queue.name),
          ns: redisKeys.validateNamespace(queue.ns),
        };
  }

  getQueues(
    redisClient: RedisClient,
    config: IRequiredConfig,
    cb: ICallback<TQueueParams[]>,
  ): void {
    const queue = Queue.getParams(config, this.bindingParams);
    cb(null, [queue]);
  }

  static fromJSON(json: Partial<IDirectExchangeParams>): DirectExchange {
    if (!json.bindingParams)
      throw new ExchangeError('Binding params are required.');
    const e = new DirectExchange(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
}
