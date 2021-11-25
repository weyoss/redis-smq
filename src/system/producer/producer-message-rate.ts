import { Producer } from './producer';
import { IProducerMessageRateFields } from '../../../types';
import { MessageRate } from '../message-rate';
import { RedisClient } from '../redis-client/redis-client';

export class ProducerMessageRate extends MessageRate<IProducerMessageRateFields> {
  protected inputSlots: number[] = new Array(1000).fill(0);
  protected inputRate = 0;
  protected producer: Producer;
  protected keyIndexRate: string;
  protected keyProducerRateInput: string;

  constructor(producer: Producer, redisClient: RedisClient) {
    super(redisClient);
    this.producer = producer;
    const { keyIndexRates, keyRateProducerInput } =
      this.producer.getRedisKeys();
    this.keyIndexRate = keyIndexRates;
    this.keyProducerRateInput = keyRateProducerInput;
  }

  getRateFields(): IProducerMessageRateFields {
    this.inputRate = this.inputSlots.reduce((acc, cur) => acc + cur, 0);
    this.inputSlots.fill(0);
    return {
      inputRate: this.inputRate,
    };
  }

  formatRateFields(rates: IProducerMessageRateFields): string[] {
    const now = Date.now();
    const { inputRate } = rates;
    return [this.keyProducerRateInput, `${inputRate}|${now}`];
  }

  incrementInputSlot(): void {
    const slot = new Date().getMilliseconds();
    this.inputSlots[slot] += 1;
  }
}
