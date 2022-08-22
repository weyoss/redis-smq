import { Exchange } from './exchange';
import {
  EMessageExchange,
  IRequiredConfig,
  IMessageExchangeFanOut,
  TQueueParams,
  TFanOutParams,
} from '../../../types';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';

export class FanOutExchange extends Exchange {
  protected type = EMessageExchange.FANOUT;
  protected bindingParams: string | TFanOutParams;

  constructor(bindingParams: string | TFanOutParams) {
    super();
    this.bindingParams = bindingParams;
  }

  getBindingParams(): string | TFanOutParams {
    return this.bindingParams;
  }

  //@todo
  getQueues(
    redisClient: RedisClient,
    config: IRequiredConfig,
    cb: ICallback<TQueueParams[]>,
  ): void {
    //
  }

  override toJSON(): IMessageExchangeFanOut {
    return {
      ...super.toJSON(),
      type: EMessageExchange.FANOUT,
      bindingParams: this.bindingParams,
    };
  }

  static createInstanceFrom(json: Record<string, any>): FanOutExchange {
    const name = String(json['name']);
    const e = new FanOutExchange(name);
    e.populate(json);
    return e;
  }
}
