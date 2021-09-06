import { Message } from './message';
import { Multi } from 'redis';
import { TCallback, TCompatibleRedisClient } from '../types';
import { Consumer } from './consumer';
import { events } from './events';
import { Scheduler } from './scheduler';
import * as Logger from 'bunyan';

export class GCMessageCollector {
  protected consumer: Consumer;
  protected scheduler: Scheduler;
  protected logger: Logger;
  protected keyQueue: string;
  protected keyQueueDLQ: string;
  protected redisClientInstance: TCompatibleRedisClient;

  constructor(consumer: Consumer, redisClientInstance: TCompatibleRedisClient) {
    this.consumer = consumer;
    this.scheduler = consumer.getScheduler();
    this.logger = consumer.getLogger();
    this.redisClientInstance = redisClientInstance;
    const { keyQueue, keyQueueDLQ } = consumer.getInstanceRedisKeys();
    this.keyQueue = keyQueue;
    this.keyQueueDLQ = keyQueueDLQ;
  }

  protected debug(message: string): void {
    this.logger.debug({ gc: true }, message);
  }

  protected requeueMessageAfterDelay(
    message: Message,
    delay: number,
    multi: Multi,
  ): void {
    this.debug(
      `Scheduling message ID [${message.getId()}]  (delay: [${delay}])...`,
    );
    message.setScheduledDelay(delay);
    this.scheduler.schedule(message, multi);
  }

  protected moveMessageToDLQ(message: Message, multi: Multi): void {
    this.debug(
      `Moving message [${message.getId()}] to DLQ [${this.keyQueueDLQ}]...`,
    );
    multi.lpush(this.keyQueueDLQ, message.toString());
  }

  protected requeueMessage(message: Message, multi: Multi): void {
    this.debug(`Re-queuing message [${message.getId()}] ...`);
    multi.lpush(this.keyQueue, message.toString());
  }

  protected checkMessageThreshold(message: Message): boolean {
    const attempts = message.incrAttempts();
    const threshold = message.getRetryThreshold();
    const retryThreshold =
      typeof threshold === 'number'
        ? threshold
        : this.consumer.getMessageRetryThreshold();
    return attempts < retryThreshold;
  }

  hasMessageExpired(message: Message): boolean {
    const ttl = message.getTTL();
    const messageTTL =
      typeof ttl === 'number' ? ttl : this.consumer.getConsumerMessageTTL();
    if (messageTTL) {
      const curTime = new Date().getTime();
      const createdAt = message.getCreatedAt();
      return createdAt + messageTTL - curTime <= 0;
    }
    return false;
  }

  /**
   * Move the message to DLQ queue when max attempts threshold is reached or otherwise re-queue it again.
   * Only non-periodic messages are re-queued. Failure of periodic messages is ignored since such messages
   * are periodically scheduled for delivery.
   */
  collectMessage(
    message: Message,
    processingQueue: string,
    cb: TCallback<void | string>,
  ): void {
    if (this.hasMessageExpired(message)) {
      this.debug(`Message [${message.getId()}]: Collecting expired message...`);
      this.collectExpiredMessage(message, processingQueue, cb);
    } else if (this.scheduler.isPeriodic(message)) {
      this.redisClientInstance.rpop(processingQueue, cb);
    } else {
      let delayed = false;
      let requeued = false;
      const multi = this.redisClientInstance.multi();
      multi.rpop(processingQueue);
      const retry = this.checkMessageThreshold(message);
      if (retry) {
        const delay = message.getRetryDelay();
        const retryDelay =
          typeof delay === 'number'
            ? delay
            : this.consumer.getMessageRetryDelay();
        if (retryDelay) {
          delayed = true;
          this.requeueMessageAfterDelay(message, retryDelay, multi);
        } else {
          requeued = true;
          this.requeueMessage(message, multi);
        }
      } else this.moveMessageToDLQ(message, multi);
      multi.exec((err) => {
        if (err) cb(err);
        else {
          if (requeued) this.consumer.emit(events.GC_MESSAGE_REQUEUED, message);
          else if (delayed) {
            this.consumer.emit(events.GC_MESSAGE_DELAYED, message);
          } else this.consumer.emit(events.GC_MESSAGE_DLQ, message);
          cb();
        }
      });
    }
  }

  collectExpiredMessage(
    message: Message,
    processingQueue: string,
    cb: TCallback<void>,
  ): void {
    const id = message.getId();
    this.debug(`Processing expired message [${id}]...`);
    // Just pop it out
    this.redisClientInstance.rpop(processingQueue, (err?: Error | null) => {
      if (err) cb(err);
      else {
        this.consumer.emit(events.GC_MESSAGE_DESTROYED, message);
        cb();
      }
    });
  }
}
