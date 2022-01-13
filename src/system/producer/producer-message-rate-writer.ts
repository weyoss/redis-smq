import { MessageRateWriter } from '../common/message-rate-writer';
import {
  ICallback,
  IProducerMessageRateFields,
  TQueueParams,
} from '../../../types';
import * as async from 'async';
import { ProducerPublishedTimeSeries } from './producer-time-series/producer-published-time-series';
import { QueuePublishedTimeSeries } from './producer-time-series/queue-published-time-series';
import { GlobalPublishedTimeSeries } from './producer-time-series/global-published-time-series';
import { RedisClient } from '../common/redis-client/redis-client';
import { ProducerMessageRate } from './producer-message-rate';

export class ProducerMessageRateWriter extends MessageRateWriter {
  protected redisClient: RedisClient;
  protected publishedTimeSeries: ReturnType<typeof ProducerPublishedTimeSeries>;
  protected queuePublishedTimeSeries: ReturnType<
    typeof QueuePublishedTimeSeries
  >;
  protected globalPublishedTimeSeries: ReturnType<
    typeof GlobalPublishedTimeSeries
  >;

  constructor(
    redisClient: RedisClient,
    queue: TQueueParams,
    producerId: string,
    producerMessageRate: ProducerMessageRate,
  ) {
    super(producerMessageRate);
    this.redisClient = redisClient;
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

  onQuit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => this.publishedTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.queuePublishedTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.globalPublishedTimeSeries.quit(cb),
      ],
      cb,
    );
  }
}
