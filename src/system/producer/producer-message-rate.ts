import { IProducerMessageRateFields } from '../../../types';
import { MessageRate } from '../message-rate';

export class ProducerMessageRate extends MessageRate<IProducerMessageRateFields> {
  protected publishedRate = 0;

  getRateFields(): IProducerMessageRateFields {
    const publishedRate = this.publishedRate;
    this.publishedRate = 0;
    return {
      publishedRate,
    };
  }

  incrementPublished(): void {
    this.publishedRate += 1;
  }
}
