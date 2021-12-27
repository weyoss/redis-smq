import { Consumer } from '../consumer';
import { ICallback, IConsumerMessageRateFields } from '../../../../types';
import { MessageRate } from '../../message-rate';
import { RedisClient } from '../../redis-client/redis-client';
import * as async from 'async';
import {
  AcknowledgedTimeSeries,
  GlobalAcknowledgedTimeSeries,
  GlobalDeadLetteredTimeSeries,
  QueueAcknowledgedTimeSeries,
  QueueDeadLetteredTimeSeries,
  DeadLetteredTimeSeries,
} from '../consumer-time-series';
import { events } from '../../common/events';

export class ConsumerMessageRate extends MessageRate<IConsumerMessageRateFields> {
  protected consumer: Consumer;
  protected acknowledgedRate = 0;
  protected deadLetteredRate = 0;
  protected idleStack: number[] = new Array(5).fill(0);

  protected acknowledgedTimeSeries: ReturnType<typeof AcknowledgedTimeSeries>;
  protected deadLetteredTimeSeries: ReturnType<typeof DeadLetteredTimeSeries>;
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

  constructor(consumer: Consumer, redisClient: RedisClient) {
    super(redisClient);
    this.consumer = consumer;
    this.globalAcknowledgedRateTimeSeries = GlobalAcknowledgedTimeSeries(
      redisClient,
      true,
    );
    this.globalDeadLetteredTimeSeries = GlobalDeadLetteredTimeSeries(
      redisClient,
      true,
    );
    this.acknowledgedTimeSeries = AcknowledgedTimeSeries(
      redisClient,
      consumer.getId(),
      consumer.getQueue(),
      true,
    );
    this.deadLetteredTimeSeries = DeadLetteredTimeSeries(
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

  // Returns true if the consumer has been
  // inactive for the last 5 seconds
  isIdle(): boolean {
    if (this.acknowledgedRate === 0 && this.deadLetteredRate === 0) {
      this.idleStack.push(1);
    } else {
      this.idleStack.push(0);
    }
    this.idleStack.shift();
    return this.idleStack.find((i) => i === 0) === undefined;
  }

  getRateFields(): IConsumerMessageRateFields {
    const acknowledgedRate = this.acknowledgedRate;
    this.acknowledgedRate = 0;
    const deadLetteredRate = this.deadLetteredRate;
    this.deadLetteredRate = 0;
    if (process.env.NODE_ENV === 'test' && this.isIdle()) {
      this.consumer.emit(events.IDLE);
    }
    return {
      acknowledgedRate,
      deadLetteredRate,
    };
  }

  incrementAcknowledged(): void {
    this.acknowledgedRate += 1;
  }

  incrementDeadLettered(): void {
    this.deadLetteredRate += 1;
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

  quit(cb: ICallback<void>): void {
    async.waterfall(
      [
        (cb: ICallback<void>) => super.quit(cb),
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
