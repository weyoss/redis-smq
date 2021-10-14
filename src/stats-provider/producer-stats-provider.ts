import { Producer } from '../producer';
import { IProducerStats, IStatsProvider } from '../../types';

export class ProducerStatsProvider implements IStatsProvider {
  protected inputSlots: number[] = new Array(1000).fill(0);
  protected inputRate = 0;
  protected producer: Producer;
  protected keyIndexRate: string;
  protected keyProducerRateInput: string;

  constructor(producer: Producer) {
    this.producer = producer;
    const { keyIndexRates, keyRateProducerInput } =
      this.producer.getInstanceRedisKeys();
    this.keyIndexRate = keyIndexRates;
    this.keyProducerRateInput = keyRateProducerInput;
  }

  getStats() {
    this.inputRate = this.inputSlots.reduce((acc, cur) => acc + cur, 0);
    this.inputSlots.fill(0);
    return {
      inputRate: this.inputRate,
    };
  }

  format(stats: IProducerStats): string[] {
    const now = Date.now();
    const { inputRate } = stats;
    return [this.keyProducerRateInput, `${inputRate}|${now}`];
  }

  incrementInputSlot(): void {
    const slot = new Date().getMilliseconds();
    this.inputSlots[slot] += 1;
  }
}
