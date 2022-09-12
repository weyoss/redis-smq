import {
  EExchangeType,
  IExchangeParams,
  IRequiredConfig,
  TQueueParams,
} from '../../../types';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { v4 as uuid } from 'uuid';
import { DestinationQueueRequiredError } from './errors/destination-queue-required.error';

export abstract class Exchange<
  TBindingParams,
  TBindingType extends EExchangeType,
> {
  protected exchangeTag: string;
  protected destinationQueue: TQueueParams | null = null;
  protected bindingParams: TBindingParams;
  protected type: TBindingType;

  protected constructor(bindingParams: TBindingParams, type: TBindingType) {
    this.bindingParams = this.validateBindingParams(bindingParams);
    this.type = type;
    this.exchangeTag = this.generateExchangeTag();
  }

  protected generateExchangeTag(): string {
    return `${this.constructor.name
      .replace(/([a-z])([A-Z])/, '$1-$2')
      .toLowerCase()}-${uuid()}`;
  }

  setDestinationQueue(queue: TQueueParams | null): void {
    this.destinationQueue = queue;
  }

  getBindingParams(): TBindingParams {
    return this.bindingParams;
  }

  getDestinationQueue(): TQueueParams | null {
    return this.destinationQueue;
  }

  getRequiredDestinationQueue(): TQueueParams {
    if (!this.destinationQueue) {
      throw new DestinationQueueRequiredError();
    }
    return this.destinationQueue;
  }

  toJSON(): IExchangeParams<TBindingParams, TBindingType> {
    return {
      exchangeTag: this.exchangeTag,
      destinationQueue: this.destinationQueue,
      bindingParams: this.bindingParams,
      type: this.type,
    };
  }

  fromJSON(JSON: Partial<IExchangeParams<TBindingParams, TBindingType>>): void {
    if (JSON.destinationQueue) this.setDestinationQueue(JSON.destinationQueue);
    if (JSON.exchangeTag) this.exchangeTag = JSON.exchangeTag;
    if (JSON.type) this.type = JSON.type;
  }

  protected abstract validateBindingParams(
    bindingParams: TBindingParams,
  ): TBindingParams;

  abstract getQueues(
    redisClient: RedisClient,
    config: IRequiredConfig,
    cb: ICallback<TQueueParams[]>,
  ): void;
}
