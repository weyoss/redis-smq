import { IProducerMessageRateFields, TQueueParams } from '../../../../types';
import { MessageRate } from '../../common/message-rate';

export class ProducerMessageRate extends MessageRate<IProducerMessageRateFields> {
  protected publishedRate = 0;
  protected queuePublishedRate: Record<string, number> = {};

  incrementPublished(queue: TQueueParams): void {
    const key = `${queue.ns}:${queue.name}`;
    if (!this.queuePublishedRate[key]) {
      this.queuePublishedRate[key] = 0;
    }
    this.queuePublishedRate[key] += 1;
    this.publishedRate += 1;
  }

  getRateFields(): IProducerMessageRateFields {
    const publishedRate = this.publishedRate;
    this.publishedRate = 0;
    const queuePublishedRate = {
      ...this.queuePublishedRate,
    };
    for (const key in this.queuePublishedRate) {
      this.queuePublishedRate[key] = 0;
    }
    return {
      publishedRate,
      queuePublishedRate,
    };
  }
}
