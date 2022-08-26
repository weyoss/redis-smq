import { Exchange } from './exchange';
import {
  EExchangeType,
  IFanOutExchangeParams,
  IRequiredConfig,
  TQueueParams,
} from '../../../types';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { QueueExchange } from '../queue-manager/queue-exchange';
import { ExchangeError } from './errors/exchange.error';

export class FanOutExchange extends Exchange<string, EExchangeType.FANOUT> {
  constructor(fanOutName: string) {
    super(fanOutName, EExchangeType.FANOUT);
  }

  protected override validateBindingParams(bindingParams: string): string {
    return bindingParams;
  }

  getQueues(
    redisClient: RedisClient,
    config: IRequiredConfig,
    cb: ICallback<TQueueParams[]>,
  ): void {
    QueueExchange.getExchangeBindings(redisClient, this, cb);
  }

  static fromJSON(json: Partial<IFanOutExchangeParams>): FanOutExchange {
    if (!json.bindingParams)
      throw new ExchangeError('Binding params are required.');
    const e = new FanOutExchange(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
}
