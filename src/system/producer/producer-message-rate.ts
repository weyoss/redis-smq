import {
  ICallback,
  IProducerMessageRateFields,
  TQueueParams,
} from '../../../types';
import { MessageRate } from '../message-rate';
import { RedisClient } from '../redis-client/redis-client';
import * as async from 'async';
import { GlobalPublishedTimeSeries } from '../time-series/global-published-time-series';
import { ProducerPublishedTimeSeries } from '../time-series/producer-published-time-series';
import { QueuePublishedTimeSeries } from '../time-series/queue-published-time-series';

export class ProducerMessageRate extends MessageRate<IProducerMessageRateFields> {
  protected publishedRate = 0;
  protected publishedTimeSeries: ReturnType<typeof ProducerPublishedTimeSeries>;
  protected queuePublishedTimeSeries: ReturnType<
    typeof QueuePublishedTimeSeries
  >;
  protected globalPublishedTimeSeries: ReturnType<
    typeof GlobalPublishedTimeSeries
  >;

  constructor(
    queue: TQueueParams,
    producerId: string,
    redisClient: RedisClient,
  ) {
    super(redisClient);
    this.publishedTimeSeries = ProducerPublishedTimeSeries(
      redisClient,
      producerId,
      queue,
      true,
    );
    this.queuePublishedTimeSeries = QueuePublishedTimeSeries(
      this.redisClient,
      queue,
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
