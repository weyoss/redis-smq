import { MessageRateWriter } from '../common/message-rate-writer';
import {
  ICallback,
  IMultiQueueProducerMessageRateFields,
} from '../../../types';
import * as async from 'async';
import { RedisClient } from '../redis-client/redis-client';
import { QueuePublishedTimeSeries } from '../producer/producer-time-series/queue-published-time-series';
import { GlobalPublishedTimeSeries } from '../producer/producer-time-series/global-published-time-series';
import { MultiQueueProducerPublishedTimeSeries } from './multi-queue-producer-time-series/multi-queue-producer-published-time-series';
import { MultiQueueProducerMessageRate } from './multi-queue-producer-message-rate';

export class MultiQueueProducerMessageRateWriter extends MessageRateWriter {
  protected redisClient: RedisClient;
  protected publishedTimeSeries: ReturnType<
    typeof MultiQueueProducerPublishedTimeSeries
  >;
  protected globalPublishedTimeSeries: ReturnType<
    typeof GlobalPublishedTimeSeries
  >;
  protected queuePublishedTimeSeries: Record<
    string,
    ReturnType<typeof QueuePublishedTimeSeries>
  > = {};

  constructor(
    redisClient: RedisClient,
    producerId: string,
    multiQueueProducerMessageRate: MultiQueueProducerMessageRate,
  ) {
    super(multiQueueProducerMessageRate);
    this.redisClient = redisClient;
    this.globalPublishedTimeSeries = GlobalPublishedTimeSeries(
      redisClient,
      true,
    );
    this.publishedTimeSeries = MultiQueueProducerPublishedTimeSeries(
      redisClient,
      producerId,
      true,
    );
  }

  onUpdate(
    ts: number,
    rates: IMultiQueueProducerMessageRateFields,
    cb: ICallback<void>,
  ): void {
    const { publishedRate, queuePublishedRate } = rates;
    if (Object.keys(queuePublishedRate).length) {
      const multi = this.redisClient.multi();
      this.publishedTimeSeries.add(ts, publishedRate, multi);
      this.globalPublishedTimeSeries.add(ts, publishedRate, multi);
      for (const key in queuePublishedRate) {
        if (!this.queuePublishedTimeSeries[key]) {
          const [ns, name] = key.split(':');
          this.queuePublishedTimeSeries[key] = QueuePublishedTimeSeries(
            this.redisClient,
            { ns, name },
            true,
          );
        }
        this.queuePublishedTimeSeries[key].add(
          ts,
          queuePublishedRate[key],
          multi,
        );
      }
      this.redisClient.execMulti(multi, () => cb());
    } else cb();
  }

  onQuit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => this.publishedTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.globalPublishedTimeSeries.quit(cb),
        (cb: ICallback<void>) => {
          async.eachOf(
            this.queuePublishedTimeSeries,
            (item, key, done) => {
              item.quit(() => done());
            },
            cb,
          );
        },
      ],
      cb,
    );
  }
}
