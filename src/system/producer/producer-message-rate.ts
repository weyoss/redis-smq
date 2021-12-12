import { Producer } from './producer';
import { ICallback, IProducerMessageRateFields } from '../../../types';
import { MessageRate } from '../message-rate';
import { RedisClient } from '../redis-client/redis-client';
import { SortedSetTimeSeries } from '../common/time-series/sorted-set-time-series';
import { HashTimeSeries } from '../common/time-series/hash-time-series';
import * as async from 'async';

export class ProducerMessageRate extends MessageRate<IProducerMessageRateFields> {
  protected inputSlots: number[] = new Array(1000).fill(0);
  protected inputRate = 0;
  protected producer: Producer;
  protected inputRateTimeSeries: SortedSetTimeSeries;
  protected queueInputRateTimeSeries: HashTimeSeries;
  protected globalInputRateTimeSeries: HashTimeSeries;

  constructor(producer: Producer, redisClient: RedisClient) {
    super(redisClient);
    this.producer = producer;
    const {
      keyRateProducerInput,
      keyRateQueueInput,
      keyRateQueueInputIndex,
      keyRateGlobalInput,
      keyRateGlobalInputIndex,
    } = this.producer.getRedisKeys();
    this.inputRateTimeSeries = new SortedSetTimeSeries(
      redisClient,
      keyRateProducerInput,
    );
    this.queueInputRateTimeSeries = new HashTimeSeries(
      redisClient,
      keyRateQueueInput,
      keyRateQueueInputIndex,
    );
    this.globalInputRateTimeSeries = new HashTimeSeries(
      redisClient,
      keyRateGlobalInput,
      keyRateGlobalInputIndex,
    );
  }

  getRateFields(): IProducerMessageRateFields {
    this.inputRate = this.inputSlots.reduce((acc, cur) => acc + cur, 0);
    this.inputSlots.fill(0);
    return {
      inputRate: this.inputRate,
    };
  }

  incrementInputSlot(): void {
    const slot = new Date().getMilliseconds();
    this.inputSlots[slot] += 1;
  }

  onUpdate(
    ts: number,
    rates: IProducerMessageRateFields,
    cb: ICallback<void>,
  ): void {
    const multi = this.redisClient.multi();
    const { inputRate } = rates;
    this.inputRateTimeSeries.add(ts, inputRate, multi);
    this.queueInputRateTimeSeries.add(ts, inputRate, multi);
    this.globalInputRateTimeSeries.add(ts, inputRate, multi);
    this.redisClient.execMulti(multi, () => cb());
  }

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => super.quit(cb),
        (cb: ICallback<void>) => this.inputRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.queueInputRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.globalInputRateTimeSeries.quit(cb),
      ],
      cb,
    );
  }
}
