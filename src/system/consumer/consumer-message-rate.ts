import { Consumer } from './consumer';
import { ICallback, IConsumerMessageRateFields } from '../../../types';
import { events } from '../common/events';
import { MessageRate } from '../message-rate';
import { RedisClient } from '../redis-client/redis-client';
import * as async from 'async';
import { timeSeries } from '../common/time-series';

export class ConsumerMessageRate extends MessageRate<IConsumerMessageRateFields> {
  protected consumer: Consumer;
  protected keyConsumerRateProcessing: string;
  protected keyConsumerRateAcknowledged: string;
  protected keyConsumerRateUnacknowledged: string;
  protected processingSlots: number[] = new Array(1000).fill(0);
  protected acknowledgedSlots: number[] = new Array(1000).fill(0);
  protected unacknowledgedSlots: number[] = new Array(1000).fill(0);
  protected processingRate = 0;
  protected acknowledgedRate = 0;
  protected unacknowledgedRate = 0;
  protected idleStack: number[] = new Array(5).fill(0);

  constructor(consumer: Consumer, redisClient: RedisClient) {
    super(redisClient);
    this.consumer = consumer;
    const {
      keyRateConsumerProcessing,
      keyRateConsumerAcknowledged,
      keyRateConsumerUnacknowledged,
    } = consumer.getRedisKeys();
    this.keyConsumerRateProcessing = keyRateConsumerProcessing;
    this.keyConsumerRateAcknowledged = keyRateConsumerAcknowledged;
    this.keyConsumerRateUnacknowledged = keyRateConsumerUnacknowledged;
  }

  // Returns true if the consumer has been
  // inactive for the last 5 seconds
  isIdle(): boolean {
    if (
      this.processingRate === 0 &&
      this.acknowledgedRate === 0 &&
      this.unacknowledgedRate === 0
    ) {
      this.idleStack.push(1);
    } else {
      this.idleStack.push(0);
    }
    this.idleStack.shift();
    return this.idleStack.find((i) => i === 0) === undefined;
  }

  getRateFields(): IConsumerMessageRateFields {
    this.processingRate = this.processingSlots.reduce(
      (acc: number, cur: number) => acc + cur,
      0,
    );
    this.processingSlots.fill(0);
    this.acknowledgedRate = this.acknowledgedSlots.reduce(
      (acc: number, cur: number) => acc + cur,
      0,
    );
    this.acknowledgedSlots.fill(0);
    this.unacknowledgedRate = this.unacknowledgedSlots.reduce(
      (acc: number, cur: number) => acc + cur,
      0,
    );
    this.unacknowledgedSlots.fill(0);
    if (process.env.NODE_ENV === 'test' && this.isIdle()) {
      this.consumer.emit(events.IDLE);
    }
    return {
      processingRate: this.processingRate,
      acknowledgedRate: this.acknowledgedRate,
      unacknowledgedRate: this.unacknowledgedRate,
    };
  }

  mapFieldToKey(key: keyof IConsumerMessageRateFields): string {
    const {
      keyRateConsumerProcessing,
      keyRateConsumerAcknowledged,
      keyRateConsumerUnacknowledged,
    } = this.consumer.getRedisKeys();
    if (key === 'acknowledgedRate') {
      return keyRateConsumerAcknowledged;
    }
    if (key === 'unacknowledgedRate') {
      return keyRateConsumerUnacknowledged;
    }
    return keyRateConsumerProcessing;
  }

  mapFieldToGlobalKey(key: keyof IConsumerMessageRateFields): string {
    const {
      keyRateGlobalAcknowledged,
      keyRateGlobalUnacknowledged,
      keyRateGlobalProcessing,
    } = this.consumer.getRedisKeys();
    if (key === 'acknowledgedRate') {
      return keyRateGlobalAcknowledged;
    }
    if (key === 'unacknowledgedRate') {
      return keyRateGlobalUnacknowledged;
    }
    return keyRateGlobalProcessing;
  }

  mapFieldToQueueKey(key: keyof IConsumerMessageRateFields): string {
    const {
      keyRateQueueAcknowledged,
      keyRateQueueProcessing,
      keyRateQueueUnacknowledged,
    } = this.consumer.getRedisKeys();
    if (key === 'acknowledgedRate') {
      return keyRateQueueAcknowledged;
    }
    if (key === 'unacknowledgedRate') {
      return keyRateQueueUnacknowledged;
    }
    return keyRateQueueProcessing;
  }

  incrementProcessingSlot(): void {
    const slot = new Date().getMilliseconds();
    this.processingSlots[slot] += 1;
  }

  incrementAcknowledgedSlot(): void {
    const slot = new Date().getMilliseconds();
    this.acknowledgedSlots[slot] += 1;
  }

  incrementUnacknowledgedSlot(): void {
    const slot = new Date().getMilliseconds();
    this.unacknowledgedSlots[slot] += 1;
  }

  init(cb: ICallback<void>): void {
    const {
      keyRateGlobalAcknowledged,
      keyRateGlobalProcessing,
      keyRateGlobalUnacknowledged,
      keyRateQueueProcessing,
      keyRateQueueUnacknowledged,
      keyRateQueueAcknowledged,
    } = this.consumer.getRedisKeys();
    const ts = timeSeries.getCurrentTimestamp();
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          timeSeries.initHash(
            this.redisClient,
            keyRateGlobalAcknowledged,
            ts,
            cb,
          );
        },
        (cb: ICallback<void>) => {
          timeSeries.initHash(
            this.redisClient,
            keyRateGlobalProcessing,
            ts,
            cb,
          );
        },
        (cb: ICallback<void>) => {
          timeSeries.initHash(
            this.redisClient,
            keyRateGlobalUnacknowledged,
            ts,
            cb,
          );
        },
        (cb: ICallback<void>) => {
          timeSeries.initHash(
            this.redisClient,
            keyRateQueueAcknowledged,
            ts,
            cb,
          );
        },
        (cb: ICallback<void>) => {
          timeSeries.initHash(this.redisClient, keyRateQueueProcessing, ts, cb);
        },
        (cb: ICallback<void>) => {
          timeSeries.initHash(
            this.redisClient,
            keyRateQueueUnacknowledged,
            ts,
            cb,
          );
        },
        (cb: ICallback<void>) => {
          timeSeries.initSortedSet(
            this.redisClient,
            this.keyConsumerRateAcknowledged,
            ts,
            10,
            cb,
          );
        },
        (cb: ICallback<void>) => {
          timeSeries.initSortedSet(
            this.redisClient,
            this.keyConsumerRateProcessing,
            ts,
            10,
            cb,
          );
        },
        (cb: ICallback<void>) => {
          timeSeries.initSortedSet(
            this.redisClient,
            this.keyConsumerRateUnacknowledged,
            ts,
            10,
            cb,
          );
        },
      ],
      (err) => cb(err),
    );
  }
}
