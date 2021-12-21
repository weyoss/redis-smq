import { Consumer } from '../consumer';
import { ICallback, IConsumerMessageRateFields } from '../../../../types';
import { MessageRate } from '../../message-rate';
import { RedisClient } from '../../redis-client/redis-client';
import * as async from 'async';
import {
  AcknowledgedRateTimeSeries,
  GlobalAcknowledgedRateTimeSeries,
  GlobalProcessingRateTimeSeries,
  GlobalUnacknowledgedRateTimeSeries,
  ProcessingRateTimeSeries,
  QueueAcknowledgedRateTimeSeries,
  QueueProcessingRateTimeSeries,
  QueueUnacknowledgedRateTimeSeries,
  UnacknowledgedRateTimeSeries,
} from './consumer-message-rate-time-series';

export class ConsumerMessageRate extends MessageRate<IConsumerMessageRateFields> {
  protected consumer: Consumer;
  protected processingRate = 0;
  protected acknowledgedRate = 0;
  protected unacknowledgedRate = 0;
  protected idleStack: number[] = new Array(5).fill(0);

  protected processingRateTimeSeries: ReturnType<
    typeof ProcessingRateTimeSeries
  >;
  protected acknowledgedRateTimeSeries: ReturnType<
    typeof AcknowledgedRateTimeSeries
  >;
  protected unacknowledgedRateTimeSeries: ReturnType<
    typeof UnacknowledgedRateTimeSeries
  >;
  protected queueProcessingRateTimeSeries: ReturnType<
    typeof QueueProcessingRateTimeSeries
  >;
  protected queueAcknowledgedRateTimeSeries: ReturnType<
    typeof QueueAcknowledgedRateTimeSeries
  >;
  protected queueUnacknowledgedRateTimeSeries: ReturnType<
    typeof QueueUnacknowledgedRateTimeSeries
  >;
  protected globalProcessingRateTimeSeries: ReturnType<
    typeof GlobalProcessingRateTimeSeries
  >;
  protected globalAcknowledgedRateTimeSeries: ReturnType<
    typeof GlobalAcknowledgedRateTimeSeries
  >;
  protected globalUnacknowledgedRateTimeSeries: ReturnType<
    typeof GlobalUnacknowledgedRateTimeSeries
  >;

  constructor(consumer: Consumer, redisClient: RedisClient) {
    super(redisClient);
    this.consumer = consumer;
    this.globalProcessingRateTimeSeries =
      GlobalProcessingRateTimeSeries(redisClient);
    this.globalAcknowledgedRateTimeSeries =
      GlobalAcknowledgedRateTimeSeries(redisClient);
    this.globalUnacknowledgedRateTimeSeries =
      GlobalUnacknowledgedRateTimeSeries(redisClient);
    this.processingRateTimeSeries = ProcessingRateTimeSeries(
      redisClient,
      consumer.getId(),
      consumer.getQueueName(),
    );
    this.acknowledgedRateTimeSeries = AcknowledgedRateTimeSeries(
      redisClient,
      consumer.getId(),
      consumer.getQueueName(),
    );
    this.unacknowledgedRateTimeSeries = UnacknowledgedRateTimeSeries(
      redisClient,
      consumer.getId(),
      consumer.getQueueName(),
    );
    this.queueProcessingRateTimeSeries = QueueProcessingRateTimeSeries(
      redisClient,
      consumer.getQueueName(),
    );
    this.queueAcknowledgedRateTimeSeries = QueueAcknowledgedRateTimeSeries(
      redisClient,
      consumer.getQueueName(),
    );
    this.queueUnacknowledgedRateTimeSeries = QueueUnacknowledgedRateTimeSeries(
      redisClient,
      consumer.getQueueName(),
    );
  }

  // Returns true if the consumer has been
  // inactive for the last 5 seconds
  isIdle(): boolean {
    if (
      this.processingRate === 0 &&
      this.acknowledgedRate === 0 &&
      this.unacknowledgedRate === 0
    ) {
      this.idleStack.push(1);
    } else {
      this.idleStack.push(0);
    }
    this.idleStack.shift();
    return this.idleStack.find((i) => i === 0) === undefined;
  }

  getRateFields(): IConsumerMessageRateFields {
    const processingRate = this.processingRate;
    this.processingRate = 0;

    const acknowledgedRate = this.acknowledgedRate;
    this.acknowledgedRate = 0;

    const unacknowledgedRate = this.unacknowledgedRate;
    this.unacknowledgedRate = 0;

    return {
      processingRate,
      acknowledgedRate,
      unacknowledgedRate,
    };
  }

  incrementProcessing(): void {
    this.processingRate += 1;
  }

  incrementAcknowledged(): void {
    this.acknowledgedRate += 1;
  }

  incrementUnacknowledged(): void {
    this.unacknowledgedRate += 1;
  }

  onUpdate(
    ts: number,
    rates: IConsumerMessageRateFields,
    cb: ICallback<void>,
  ): void {
    const multi = this.redisClient.multi();
    for (const field in rates) {
      const value = rates[field];
      if (field === 'processingRate') {
        this.processingRateTimeSeries.add(ts, value, multi);
        this.queueProcessingRateTimeSeries.add(ts, value, multi);
        this.globalProcessingRateTimeSeries.add(ts, value, multi);
      } else if (field === 'acknowledgedRate') {
        this.acknowledgedRateTimeSeries.add(ts, value, multi);
        this.queueAcknowledgedRateTimeSeries.add(ts, value, multi);
        this.globalAcknowledgedRateTimeSeries.add(ts, value, multi);
      } else {
        this.unacknowledgedRateTimeSeries.add(ts, value, multi);
        this.queueUnacknowledgedRateTimeSeries.add(ts, value, multi);
        this.globalUnacknowledgedRateTimeSeries.add(ts, value, multi);
      }
    }
    this.redisClient.execMulti(multi, () => cb());
  }

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => super.quit(cb),
        (cb: ICallback<void>) => this.processingRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.queueProcessingRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.globalProcessingRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.acknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.queueAcknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.globalAcknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) => this.unacknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) =>
          this.queueUnacknowledgedRateTimeSeries.quit(cb),
        (cb: ICallback<void>) =>
          this.globalUnacknowledgedRateTimeSeries.quit(cb),
      ],
      cb,
    );
  }
}
