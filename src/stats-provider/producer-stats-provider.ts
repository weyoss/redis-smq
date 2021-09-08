import { Producer } from '../producer';
import { IProducerStats, IStatsProvider } from '../../types';
import { RedisClient } from '../redis-client';

export class ProducerStatsProvider implements IStatsProvider {
  protected inputSlots: number[] = new Array(1000).fill(0);
  protected inputRate = 0;
  protected producer: Producer;
  protected keyIndexRate: string;
  protected keyProducerRateInput: string;

  constructor(producer: Producer) {
    this.producer = producer;
    const { keyIndexRate, keyProducerRateInput } =
      this.producer.getInstanceRedisKeys();
    this.keyIndexRate = keyIndexRate;
    this.keyProducerRateInput = keyProducerRateInput;
  }

  tick() {
    this.inputRate = this.inputSlots.reduce((acc, cur) => acc + cur, 0);
    this.inputSlots.fill(0);
    return {
      inputRate: this.inputRate,
    };
  }

  publish(redisClient: RedisClient, stats: IProducerStats) {
    const now = Date.now();
    const { inputRate } = stats;
    redisClient.hset(
      this.keyIndexRate,
      this.keyProducerRateInput,
      `${inputRate}|${now}`,
      () => void 0,
    );
  }

  incrementInputSlot() {
    const slot = new Date().getMilliseconds();
    this.inputSlots[slot] += 1;
  }
}
