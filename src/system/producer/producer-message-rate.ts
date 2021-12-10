import { Producer } from './producer';
import { ICallback, IProducerMessageRateFields } from '../../../types';
import { MessageRate } from '../message-rate';
import { RedisClient } from '../redis-client/redis-client';
import { timeSeries } from '../common/time-series';
import * as async from 'async';

export class ProducerMessageRate extends MessageRate<IProducerMessageRateFields> {
  protected inputSlots: number[] = new Array(1000).fill(0);
  protected inputRate = 0;
  protected producer: Producer;
  protected keyProducerRateInput: string;

  constructor(producer: Producer, redisClient: RedisClient) {
    super(redisClient);
    this.producer = producer;
    const { keyRateProducerInput } = this.producer.getRedisKeys();
    this.keyProducerRateInput = keyRateProducerInput;
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

  mapFieldToGlobalKey(field: keyof IProducerMessageRateFields): string {
    const { keyRateGlobalInput } = this.producer.getRedisKeys();
    return keyRateGlobalInput;
  }

  mapFieldToQueueKey(field: keyof IProducerMessageRateFields): string {
    const { keyRateQueueInput } = this.producer.getRedisKeys();
    return keyRateQueueInput;
  }

  mapFieldToKey(field: keyof IProducerMessageRateFields): string {
    const { keyRateProducerInput } = this.producer.getRedisKeys();
    return keyRateProducerInput;
  }

  init(cb: ICallback<void>): void {
    const { keyRateGlobalInput, keyRateQueueInput, keyRateProducerInput } =
      this.producer.getRedisKeys();
    const ts = timeSeries.getCurrentTimestamp();
    async.waterfall(
      [
        (cb: ICallback<void>) => {
          timeSeries.initHash(this.redisClient, keyRateGlobalInput, ts, cb);
        },
        (cb: ICallback<void>) => {
          timeSeries.initHash(this.redisClient, keyRateQueueInput, ts, cb);
        },
        (cb: ICallback<void>) => {
          timeSeries.initSortedSet(
            this.redisClient,
            keyRateProducerInput,
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
