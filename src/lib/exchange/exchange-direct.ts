import { Exchange } from './exchange';
import {
  EExchangeType,
  IQueueParams,
  TExchangeDirectExchangeBindingParams,
} from '../../../types';
import { ICallback } from 'redis-smq-common';
import { _getQueueParams } from '../queue/queue/_get-queue-params';

export class ExchangeDirect extends Exchange<
  TExchangeDirectExchangeBindingParams,
  EExchangeType.DIRECT
> {
  constructor(queue: TExchangeDirectExchangeBindingParams) {
    super(queue, EExchangeType.DIRECT);
  }

  protected override validateBindingParams(
    queue: TExchangeDirectExchangeBindingParams,
  ): IQueueParams {
    return _getQueueParams(queue);
  }

  getQueues(cb: ICallback<IQueueParams[]>): void {
    const queue = _getQueueParams(this.bindingParams);
    cb(null, [queue]);
  }
}
