import { TQueueParams } from '../../../types';
import { MessageRate } from '../message-rate';

export interface IMultiQueueProducerMessageRateFields {
  publishedRate: number;
  queuePublishedRate: Record<string, number>;
}

export class MultiQueueProducerMessageRate extends MessageRate<IMultiQueueProducerMessageRateFields> {
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

  getRateFields(): IMultiQueueProducerMessageRateFields {
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
