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
  protected publishedTimeSeries: ReturnType<typeof PublishedTimeSeries>;
  protected queuePublishedTimeSeries: ReturnType<
    typeof QueuePublishedTimeSeries
  >;
  protected globalPublishedTimeSeries: ReturnType<
    typeof GlobalPublishedTimeSeries
  >;

  constructor(producer: Producer, redisClient: RedisClient) {
    super(redisClient);
    this.producer = producer;
    this.publishedTimeSeries = PublishedTimeSeries(
      redisClient,
      producer.getId(),
      producer.getQueue(),
      true,
    );
    this.queuePublishedTimeSeries = QueuePublishedTimeSeries(
      this.redisClient,
      producer.getQueue(),
      true,
    );
    this.globalPublishedTimeSeries = GlobalPublishedTimeSeries(
      this.redisClient,
      true,
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
    this.publishedTimeSeries.add(ts, publishedRate, multi);
    this.queuePublishedTimeSeries.add(ts, publishedRate, multi);
    this.globalPublishedTimeSeries.add(ts, publishedRate, multi);
    this.redisClient.execMulti(multi, () => cb());
  }

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => super.quit(cb),
        (cb: ICallback<void>) => this.publishedTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.queuePublishedTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.globalPublishedTimeSeries.quit(cb),
      ],
      cb,
    );
  }
}
