import { ConsumerMessageRate } from './consumer-message-rate';
import { ConsumerAcknowledgedTimeSeries } from './consumer-time-series/consumer-acknowledged-time-series';
import { ConsumerDeadLetteredTimeSeries } from './consumer-time-series/consumer-dead-lettered-time-series';
import { QueueAcknowledgedTimeSeries } from './consumer-time-series/queue-acknowledged-time-series';
import { QueueDeadLetteredTimeSeries } from './consumer-time-series/queue-dead-lettered-time-series';
import { GlobalAcknowledgedTimeSeries } from './consumer-time-series/global-acknowledged-time-series';
import { GlobalDeadLetteredTimeSeries } from './consumer-time-series/global-dead-lettered-time-series';
import { Consumer } from './consumer';
import { RedisClient } from '../redis-client/redis-client';
import { ICallback, IConsumerMessageRateFields } from '../../../types';
import * as async from 'async';
import { MessageRateWriter } from '../common/message-rate-writer';

export class ConsumerMessageRateWriter extends MessageRateWriter {
  protected redisClient: RedisClient;
  protected acknowledgedTimeSeries: ReturnType<
    typeof ConsumerAcknowledgedTimeSeries
  >;
  protected deadLetteredTimeSeries: ReturnType<
    typeof ConsumerDeadLetteredTimeSeries
  >;
  protected queueAcknowledgedRateTimeSeries: ReturnType<
    typeof QueueAcknowledgedTimeSeries
  >;
  protected queueDeadLetteredTimeSeries: ReturnType<
    typeof QueueDeadLetteredTimeSeries
  >;
  protected globalAcknowledgedRateTimeSeries: ReturnType<
    typeof GlobalAcknowledgedTimeSeries
  >;
  protected globalDeadLetteredTimeSeries: ReturnType<
    typeof GlobalDeadLetteredTimeSeries
  >;
  constructor(
    redisClient: RedisClient,
    consumer: Consumer,
    consumerMessageRate: ConsumerMessageRate,
  ) {
    super(consumerMessageRate);
    this.redisClient = redisClient;
    this.globalAcknowledgedRateTimeSeries = GlobalAcknowledgedTimeSeries(
      redisClient,
      true,
    );
    this.globalDeadLetteredTimeSeries = GlobalDeadLetteredTimeSeries(
      redisClient,
      true,
    );
    this.acknowledgedTimeSeries = ConsumerAcknowledgedTimeSeries(
      redisClient,
      consumer.getId(),
      consumer.getQueue(),
      true,
    );
    this.deadLetteredTimeSeries = ConsumerDeadLetteredTimeSeries(
      redisClient,
      consumer.getId(),
      consumer.getQueue(),
      true,
    );
    this.queueAcknowledgedRateTimeSeries = QueueAcknowledgedTimeSeries(
      redisClient,
      consumer.getQueue(),
      true,
    );
    this.queueDeadLetteredTimeSeries = QueueDeadLetteredTimeSeries(
      redisClient,
      consumer.getQueue(),
      true,
    );
  }

  onUpdate(
    ts: number,
    rates: IConsumerMessageRateFields,
    cb: ICallback<void>,
  ): void {
    const multi = this.redisClient.multi();
    for (const field in rates) {
      const value = rates[field];
      if (field === 'acknowledgedRate') {
        this.acknowledgedTimeSeries.add(ts, value, multi);
        this.queueAcknowledgedRateTimeSeries.add(ts, value, multi);
        this.globalAcknowledgedRateTimeSeries.add(ts, value, multi);
      } else {
        this.deadLetteredTimeSeries.add(ts, value, multi);
        this.queueDeadLetteredTimeSeries.add(ts, value, multi);
        this.globalDeadLetteredTimeSeries.add(ts, value, multi);
      }
    }
    this.redisClient.execMulti(multi, () => cb());
  }

  onQuit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => this.acknowledgedTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.queueAcknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.globalAcknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.deadLetteredTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.queueDeadLetteredTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.globalDeadLetteredTimeSeries.quit(cb),
      ],
      cb,
    );
  }
}
