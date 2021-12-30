import { ICallback, TQueueParams } from '../../../types';
import { MessageRate } from '../message-rate';
import { RedisClient } from '../redis-client/redis-client';
import * as async from 'async';
import {
  GlobalPublishedTimeSeries,
  PublishedTimeSeries,
  QueuePublishedTimeSeries,
} from './producer-time-series';

export interface IMultiQueueProducerMessageRateFields {
  publishedRate: number;
  queuePublishedRate: Record<string, number>;
}

export class MultiQueueProducerMessageRate extends MessageRate<IMultiQueueProducerMessageRateFields> {
  protected publishedRate = 0;
  protected publishedTimeSeries: ReturnType<typeof PublishedTimeSeries>;
  protected globalPublishedTimeSeries: ReturnType<
    typeof GlobalPublishedTimeSeries
  >;
  protected queuePublishedRate: Record<string, number> = {};
  protected queuePublishedTimeSeries: Record<
    string,
    ReturnType<typeof QueuePublishedTimeSeries>
  > = {};

  constructor(producerId: string, redisClient: RedisClient) {
    super(redisClient);
    this.globalPublishedTimeSeries = GlobalPublishedTimeSeries(
      redisClient,
      true,
    );
    this.publishedTimeSeries = PublishedTimeSeries(
      redisClient,
      producerId,
      true,
    );
  }

  incrementPublished(queue: TQueueParams): void {
    const key = `${queue.ns}:${queue.name}`;
    if (!this.queuePublishedRate[key]) {
      this.queuePublishedTimeSeries[key] = QueuePublishedTimeSeries(
        this.redisClient,
        queue,
        true,
      );
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
      for (const key in this.queuePublishedTimeSeries) {
        this.queuePublishedTimeSeries[key].add(
          ts,
          queuePublishedRate[key],
          multi,
        );
      }
      this.redisClient.execMulti(multi, () => cb());
    } else cb();
  }

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => super.quit(cb),
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
