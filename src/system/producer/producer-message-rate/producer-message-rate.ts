import { Producer } from '../producer';
import { ICallback, IProducerMessageRateFields } from '../../../../types';
import { MessageRate } from '../../message-rate';
import { RedisClient } from '../../redis-client/redis-client';
import * as async from 'async';
import {
  GlobalPublishedTimeSeries,
  PublishedTimeSeries,
  QueuePublishedTimeSeries,
} from '../producer-time-series';

export class ProducerMessageRate extends MessageRate<IProducerMessageRateFields> {
  protected publishedRate = 0;
  protected producer: Producer;
  protected inputRateTimeSeries: ReturnType<typeof PublishedTimeSeries>;
  protected queueInputRateTimeSeries: ReturnType<
    typeof QueuePublishedTimeSeries
  >;
  protected globalInputRateTimeSeries: ReturnType<
    typeof GlobalPublishedTimeSeries
  >;

  constructor(producer: Producer, redisClient: RedisClient) {
    super(redisClient);
    this.producer = producer;
    this.inputRateTimeSeries = PublishedTimeSeries(
      redisClient,
      producer.getId(),
      producer.getQueueName(),
    );
    this.queueInputRateTimeSeries = QueuePublishedTimeSeries(
      this.redisClient,
      producer.getQueueName(),
    );
    this.globalInputRateTimeSeries = GlobalPublishedTimeSeries(
      this.redisClient,
    );
  }

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

  onUpdate(
    ts: number,
    rates: IProducerMessageRateFields,
    cb: ICallback<void>,
  ): void {
    const multi = this.redisClient.multi();
    const { publishedRate } = rates;
    this.inputRateTimeSeries.add(ts, publishedRate, multi);
    this.queueInputRateTimeSeries.add(ts, publishedRate, multi);
    this.globalInputRateTimeSeries.add(ts, publishedRate, multi);
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
