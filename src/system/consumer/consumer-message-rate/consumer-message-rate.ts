import { Consumer } from '../consumer';
import { ICallback, IConsumerMessageRateFields } from '../../../../types';
import { MessageRate } from '../../message-rate';
import { RedisClient } from '../../redis-client/redis-client';
import * as async from 'async';
import {
  AcknowledgedTimeSeries,
  GlobalAcknowledgedTimeSeries,
  GlobalProcessingTimeSeries,
  GlobalUnacknowledgedTimeSeries,
  ProcessingTimeSeries,
  QueueAcknowledgedTimeSeries,
  QueueProcessingTimeSeries,
  QueueUnacknowledgedTimeSeries,
  UnacknowledgedTimeSeries,
} from '../consumer-time-series';
import { events } from '../../common/events';

export class ConsumerMessageRate extends MessageRate<IConsumerMessageRateFields> {
  protected consumer: Consumer;
  protected processingRate = 0;
  protected acknowledgedRate = 0;
  protected unacknowledgedRate = 0;
  protected idleStack: number[] = new Array(5).fill(0);

  protected processingRateTimeSeries: ReturnType<typeof ProcessingTimeSeries>;
  protected acknowledgedRateTimeSeries: ReturnType<
    typeof AcknowledgedTimeSeries
  >;
  protected unacknowledgedRateTimeSeries: ReturnType<
    typeof UnacknowledgedTimeSeries
  >;
  protected queueProcessingRateTimeSeries: ReturnType<
    typeof QueueProcessingTimeSeries
  >;
  protected queueAcknowledgedRateTimeSeries: ReturnType<
    typeof QueueAcknowledgedTimeSeries
  >;
  protected queueUnacknowledgedRateTimeSeries: ReturnType<
    typeof QueueUnacknowledgedTimeSeries
  >;
  protected globalProcessingRateTimeSeries: ReturnType<
    typeof GlobalProcessingTimeSeries
  >;
  protected globalAcknowledgedRateTimeSeries: ReturnType<
    typeof GlobalAcknowledgedTimeSeries
  >;
  protected globalUnacknowledgedRateTimeSeries: ReturnType<
    typeof GlobalUnacknowledgedTimeSeries
  >;

  constructor(consumer: Consumer, redisClient: RedisClient) {
    super(redisClient);
    this.consumer = consumer;
    this.globalProcessingRateTimeSeries =
      GlobalProcessingTimeSeries(redisClient);
    this.globalAcknowledgedRateTimeSeries =
      GlobalAcknowledgedTimeSeries(redisClient);
    this.globalUnacknowledgedRateTimeSeries =
      GlobalUnacknowledgedTimeSeries(redisClient);
    this.processingRateTimeSeries = ProcessingTimeSeries(
      redisClient,
      consumer.getId(),
      consumer.getQueueName(),
    );
    this.acknowledgedRateTimeSeries = AcknowledgedTimeSeries(
      redisClient,
      consumer.getId(),
      consumer.getQueueName(),
    );
    this.unacknowledgedRateTimeSeries = UnacknowledgedTimeSeries(
      redisClient,
      consumer.getId(),
      consumer.getQueueName(),
    );
    this.queueProcessingRateTimeSeries = QueueProcessingTimeSeries(
      redisClient,
      consumer.getQueueName(),
    );
    this.queueAcknowledgedRateTimeSeries = QueueAcknowledgedTimeSeries(
      redisClient,
      consumer.getQueueName(),
    );
    this.queueUnacknowledgedRateTimeSeries = QueueUnacknowledgedTimeSeries(
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

    if (process.env.NODE_ENV === 'test' && this.isIdle()) {
      this.consumer.emit(events.IDLE);
    }

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
