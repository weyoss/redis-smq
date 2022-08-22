import {
  IMessageExchange,
  IRequiredConfig,
  TQueueParams,
} from '../../../types';
import { RedisClient } from 'redis-smq-common';
import { ICallback } from 'redis-smq-common/dist/types';
import { v4 as uuid } from 'uuid';
import { DestinationQueueRequiredError } from './errors/destination-queue-required.error';

export abstract class Exchange {
  protected exchangeTag: string | null = null;
  protected destinationQueue: TQueueParams | null = null;

  protected constructor() {
    this.generateExchangeTag();
  }

  protected setExchangeTag(tag: string): void {
    this.exchangeTag = tag;
  }

  protected generateExchangeTag(): string {
    const tag = `${this.constructor.name}-${uuid()}`;
    this.setExchangeTag(tag);
    return tag;
  }

  setDestinationQueue(queue: TQueueParams): void {
    this.destinationQueue = queue;
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

  toJSON(): IMessageExchange {
    return {
      exchangeTag: this.exchangeTag,
      destinationQueue: this.destinationQueue,
      type: -1,
    };
  }

  populate(JSON: Partial<IMessageExchange>): void {
    this.setExchangeTag(String(JSON.exchangeTag));
    if (JSON.destinationQueue) this.setDestinationQueue(JSON.destinationQueue);
  }

  abstract getQueues(
    redisClient: RedisClient,
    config: IRequiredConfig,
    cb: ICallback<TQueueParams[]>,
  ): void;
}
