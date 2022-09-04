import { Exchange } from './exchange';
import {
  EExchangeType,
  IFanOutExchangeParams,
  IRequiredConfig,
  TQueueParams,
} from '../../../types';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { InvalidExchangeDataError } from './errors/invalid-exchange-data.error';
import { FanOutExchangeManager } from './fan-out-exchange-manager';

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
    FanOutExchangeManager.getExchangeQueues(redisClient, this, cb);
  }

  static fromJSON(json: Partial<IFanOutExchangeParams>): FanOutExchange {
    if (!json.bindingParams || json.type !== EExchangeType.FANOUT)
      throw new InvalidExchangeDataError();
    const e = new FanOutExchange(json.bindingParams);
    e.fromJSON(json);
    return e;
  }
}
