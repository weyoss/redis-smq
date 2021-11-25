import { Consumer } from './consumer';
import { IConsumerMessageRateFields } from '../../../types';
import { events } from '../common/events';
import { MessageRate } from '../message-rate';
import { RedisClient } from '../redis-client/redis-client';

export class ConsumerMessageRate extends MessageRate<IConsumerMessageRateFields> {
  protected consumer: Consumer;
  protected keyConsumerRateProcessing: string;
  protected keyConsumerRateAcknowledged: string;
  protected keyConsumerRateUnacknowledged: string;
  protected processingSlots: number[] = new Array(1000).fill(0);
  protected acknowledgedSlots: number[] = new Array(1000).fill(0);
  protected unacknowledgedSlots: number[] = new Array(1000).fill(0);
  protected processingRate = 0;
  protected acknowledgedRate = 0;
  protected unacknowledgedRate = 0;
  protected idleStack: number[] = new Array(5).fill(0);

  // When the idle status is true, it indicates that the consumer has been
  // inactive for the last 5 seconds
  protected isIdle = false;

  constructor(consumer: Consumer, redisClient: RedisClient) {
    super(redisClient);
    this.consumer = consumer;
    const {
      keyRateConsumerProcessing,
      keyRateConsumerAcknowledged,
      keyRateConsumerUnacknowledged,
    } = consumer.getRedisKeys();
    this.keyConsumerRateProcessing = keyRateConsumerProcessing;
    this.keyConsumerRateAcknowledged = keyRateConsumerAcknowledged;
    this.keyConsumerRateUnacknowledged = keyRateConsumerUnacknowledged;
  }

  getRateFields(): IConsumerMessageRateFields {
    this.processingRate = this.processingSlots.reduce(
      (acc: number, cur: number) => acc + cur,
      0,
    );
    this.processingSlots.fill(0);
    this.acknowledgedRate = this.acknowledgedSlots.reduce(
      (acc: number, cur: number) => acc + cur,
      0,
    );
    this.acknowledgedSlots.fill(0);
    this.unacknowledgedRate = this.unacknowledgedSlots.reduce(
      (acc: number, cur: number) => acc + cur,
      0,
    );
    this.unacknowledgedSlots.fill(0);
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
    this.isIdle = this.idleStack.find((i) => i === 0) === undefined;
    if (this.isIdle) this.consumer.emit(events.IDLE);
    return {
      processingRate: this.processingRate,
      acknowledgedRate: this.acknowledgedRate,
      unacknowledgedRate: this.unacknowledgedRate,
      isIdle: this.isIdle,
    };
  }

  formatRateFields(rates: IConsumerMessageRateFields): string[] {
    const now = Date.now();
    const { processingRate, acknowledgedRate, unacknowledgedRate } = rates;
    return [
      this.keyConsumerRateProcessing,
      `${processingRate}|${now}`,
      this.keyConsumerRateAcknowledged,
      `${acknowledgedRate}|${now}`,
      this.keyConsumerRateUnacknowledged,
      `${unacknowledgedRate}|${now}`,
    ];
  }

  incrementProcessingSlot(): void {
    const slot = new Date().getMilliseconds();
    this.processingSlots[slot] += 1;
  }

  incrementAcknowledgedSlot(): void {
    const slot = new Date().getMilliseconds();
    this.acknowledgedSlots[slot] += 1;
  }

  incrementUnacknowledgedSlot(): void {
    const slot = new Date().getMilliseconds();
    this.unacknowledgedSlots[slot] += 1;
  }
}
