import { Producer } from './producer';
import { IProducerMessageRateFields } from '../../../types';
import { MessageRate } from '../message-rate';
import { RedisClient } from '../redis-client/redis-client';

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

  mapFieldToGlobalKeys(field: keyof IProducerMessageRateFields): {
    key: string;
    keyIndex: string;
  } {
    const { keyRateGlobalInput, keyRateGlobalInputIndex } =
      this.producer.getRedisKeys();
    return {
      key: keyRateGlobalInput,
      keyIndex: keyRateGlobalInputIndex,
    };
  }

  mapFieldToQueueKeys(field: keyof IProducerMessageRateFields): {
    key: string;
    keyIndex: string;
  } {
    const { keyRateQueueInput, keyRateQueueInputIndex } =
      this.producer.getRedisKeys();
    return {
      key: keyRateQueueInput,
      keyIndex: keyRateQueueInputIndex,
    };
  }

  mapFieldToKey(field: keyof IProducerMessageRateFields): string {
    const { keyRateProducerInput } = this.producer.getRedisKeys();
    return keyRateProducerInput;
  }
}
