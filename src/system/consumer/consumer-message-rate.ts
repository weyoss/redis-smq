import { Consumer } from './consumer';
import { ICallback, IConsumerMessageRateFields } from '../../../types';
import { events } from '../common/events';
import { MessageRate } from '../message-rate';
import { RedisClient } from '../redis-client/redis-client';
import { HashTimeSeries } from '../common/time-series/hash-time-series';
import { SortedSetTimeSeries } from '../common/time-series/sorted-set-time-series';
import * as async from 'async';

export class ConsumerMessageRate extends MessageRate<IConsumerMessageRateFields> {
  protected consumer: Consumer;
  protected processingSlots: number[] = new Array(1000).fill(0);
  protected acknowledgedSlots: number[] = new Array(1000).fill(0);
  protected unacknowledgedSlots: number[] = new Array(1000).fill(0);
  protected processingRate = 0;
  protected acknowledgedRate = 0;
  protected unacknowledgedRate = 0;
  protected idleStack: number[] = new Array(5).fill(0);

  protected processingRateTimeSeries: SortedSetTimeSeries;
  protected acknowledgedRateTimeSeries: SortedSetTimeSeries;
  protected unacknowledgedRateTimeSeries: SortedSetTimeSeries;
  protected queueProcessingRateTimeSeries: HashTimeSeries;
  protected queueAcknowledgedRateTimeSeries: HashTimeSeries;
  protected queueUnacknowledgedRateTimeSeries: HashTimeSeries;
  protected globalProcessingRateTimeSeries: HashTimeSeries;
  protected globalAcknowledgedRateTimeSeries: HashTimeSeries;
  protected globalUnacknowledgedRateTimeSeries: HashTimeSeries;

  constructor(consumer: Consumer, redisClient: RedisClient) {
    super(redisClient);
    this.consumer = consumer;
    const {
      keyRateConsumerProcessing,
      keyRateConsumerAcknowledged,
      keyRateConsumerUnacknowledged,
      keyRateGlobalAcknowledged,
      keyRateGlobalUnacknowledged,
      keyRateGlobalProcessing,
      keyRateGlobalAcknowledgedIndex,
      keyRateGlobalUnacknowledgedIndex,
      keyRateGlobalProcessingIndex,
      keyRateQueueAcknowledged,
      keyRateQueueProcessing,
      keyRateQueueUnacknowledged,
      keyRateQueueAcknowledgedIndex,
      keyRateQueueProcessingIndex,
      keyRateQueueUnacknowledgedIndex,
    } = consumer.getRedisKeys();
    this.processingRateTimeSeries = new SortedSetTimeSeries(
      redisClient,
      keyRateConsumerProcessing,
    );
    this.acknowledgedRateTimeSeries = new SortedSetTimeSeries(
      redisClient,
      keyRateConsumerAcknowledged,
    );
    this.unacknowledgedRateTimeSeries = new SortedSetTimeSeries(
      redisClient,
      keyRateConsumerUnacknowledged,
    );
    this.queueProcessingRateTimeSeries = new HashTimeSeries(
      redisClient,
      keyRateQueueProcessing,
      keyRateQueueProcessingIndex,
    );
    this.queueAcknowledgedRateTimeSeries = new HashTimeSeries(
      redisClient,
      keyRateQueueAcknowledged,
      keyRateQueueAcknowledgedIndex,
    );
    this.queueUnacknowledgedRateTimeSeries = new HashTimeSeries(
      redisClient,
      keyRateQueueUnacknowledged,
      keyRateQueueUnacknowledgedIndex,
    );
    this.globalProcessingRateTimeSeries = new HashTimeSeries(
      redisClient,
      keyRateGlobalProcessing,
      keyRateGlobalProcessingIndex,
    );
    this.globalAcknowledgedRateTimeSeries = new HashTimeSeries(
      redisClient,
      keyRateGlobalAcknowledged,
      keyRateGlobalAcknowledgedIndex,
    );
    this.globalUnacknowledgedRateTimeSeries = new HashTimeSeries(
      redisClient,
      keyRateGlobalUnacknowledged,
      keyRateGlobalUnacknowledgedIndex,
    );
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

  onUpdate(
    ts: number,
    rates: IConsumerMessageRateFields,
    cb: ICallback<void>,
  ): void {
    const multi = this.redisClient.multi();
    for (const field in rates) {
      const value = rates[field];
      if (field === 'processingRate') {
        this.processingRateTimeSeries.add(ts, value, multi);
        this.queueProcessingRateTimeSeries.add(ts, value, multi);
        this.globalProcessingRateTimeSeries.add(ts, value, multi);
      } else if (field === 'acknowledgedRate') {
        this.acknowledgedRateTimeSeries.add(ts, value, multi);
        this.queueAcknowledgedRateTimeSeries.add(ts, value, multi);
        this.globalAcknowledgedRateTimeSeries.add(ts, value, multi);
      } else {
        this.unacknowledgedRateTimeSeries.add(ts, value, multi);
        this.queueUnacknowledgedRateTimeSeries.add(ts, value, multi);
        this.globalUnacknowledgedRateTimeSeries.add(ts, value, multi);
      }
    }
    this.redisClient.execMulti(multi, () => cb());
  }

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => super.quit(cb),
        (cb: ICallback<void>) => this.processingRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.queueProcessingRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.globalProcessingRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.acknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.queueAcknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.globalAcknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.unacknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) =>
          this.queueUnacknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) =>
          this.globalUnacknowledgedRateTimeSeries.quit(cb),
      ],
      cb,
    );
  }
}
