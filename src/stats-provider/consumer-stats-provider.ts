import { Consumer } from '../consumer';
import {
  IConsumerStats,
  IStatsProvider,
  TCompatibleRedisClient,
} from '../../types';
import { events } from '../events';

export class ConsumerStatsProvider implements IStatsProvider {
  protected consumer: Consumer;
  protected keyIndexRate: string;
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

  constructor(consumer: Consumer) {
    this.consumer = consumer;
    const {
      keyIndexRate,
      keyConsumerRateProcessing,
      keyConsumerRateAcknowledged,
      keyConsumerRateUnacknowledged,
    } = consumer.getInstanceRedisKeys();
    this.keyIndexRate = keyIndexRate;
    this.keyConsumerRateProcessing = keyConsumerRateProcessing;
    this.keyConsumerRateAcknowledged = keyConsumerRateAcknowledged;
    this.keyConsumerRateUnacknowledged = keyConsumerRateUnacknowledged;
  }

  tick() {
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
    return {
      processingRate: this.processingRate,
      acknowledgedRate: this.acknowledgedRate,
      unacknowledgedRate: this.unacknowledgedRate,
      isIdle: this.isIdle,
    };
  }

  publish(redisClient: TCompatibleRedisClient, stats: IConsumerStats) {
    const now = Date.now();
    const { processingRate, acknowledgedRate, unacknowledgedRate, isIdle } =
      stats;
    redisClient.hmset(
      this.keyIndexRate,
      this.keyConsumerRateProcessing,
      `${processingRate}|${now}`,
      this.keyConsumerRateAcknowledged,
      `${acknowledgedRate}|${now}`,
      this.keyConsumerRateUnacknowledged,
      `${unacknowledgedRate}|${now}`,
      () => void 0,
    );
    if (isIdle) this.consumer.emit(events.IDLE);
  }

  incrementProcessingSlot() {
    const slot = new Date().getMilliseconds();
    this.processingSlots[slot] += 1;
  }

  incrementAcknowledgedSlot() {
    const slot = new Date().getMilliseconds();
    this.acknowledgedSlots[slot] += 1;
  }

  incrementUnacknowledgedSlot() {
    const slot = new Date().getMilliseconds();
    this.unacknowledgedSlots[slot] += 1;
  }
}
