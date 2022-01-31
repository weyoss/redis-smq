import { parseExpression } from 'cron-parser';
import { TQueueParams } from '../../../types';
import { ArgumentError } from '../common/errors/argument.error';
import { queueManager } from '../queue-manager/queue-manager';
import { getConfiguration } from '../common/configuration';
import { MessageMetadata } from './message-metadata';
import { PanicError } from '../common/errors/panic.error';

export class Message {
  // Do not forget about javascript users. Using an object map instead of enum
  static readonly MessagePriority = {
    LOWEST: 7,
    VERY_LOW: 6,
    LOW: 5,
    NORMAL: 4,
    ABOVE_NORMAL: 3,
    HIGH: 2,
    VERY_HIGH: 1,
    HIGHEST: 0,
  };

  protected readonly createdAt: number;

  protected queue: TQueueParams | null = null;

  protected ttl = 0;

  protected retryThreshold = 3;

  protected retryDelay = 60000;

  protected consumeTimeout = 0;

  protected body: unknown = null;

  protected priority: number | null = null;

  protected scheduledCron: string | null = null;

  protected scheduledDelay: number | null = null;

  protected scheduledPeriod: number | null = null;

  protected scheduledRepeat = 0;

  protected metadata: MessageMetadata | null = null;

  ///

  constructor() {
    this.createdAt = Date.now();
    const { message } = getConfiguration();
    this.setConsumeTimeout(message.consumeTimeout);
    this.setRetryDelay(message.retryDelay);
    this.setTTL(message.ttl);
    this.setRetryThreshold(message.retryThreshold);
  }

  getMetadata(): MessageMetadata | null {
    return this.metadata;
  }

  getSetMetadata(): MessageMetadata {
    if (!this.metadata) {
      this.metadata = new MessageMetadata();
      if (this.scheduledDelay) {
        this.metadata.setNextScheduledDelay(this.scheduledDelay);
      }
    }
    return this.metadata;
  }

  setPublishedAt(timestamp: number): Message {
    if (!this.metadata) {
      throw new PanicError(`Message has not yet been published`);
    }
    this.metadata.setPublishedAt(timestamp);
    return this;
  }

  ///

  getPublishedAt(): number | null {
    if (this.metadata) {
      return this.metadata.getPublishedAt();
    }
    return null;
  }

  getScheduledAt(): number | null {
    if (this.metadata) {
      return this.metadata.getScheduledAt();
    }
    return null;
  }

  getAttempts(): number {
    if (this.metadata) {
      return this.metadata.getAttempts();
    }
    return 0;
  }

  getMessageScheduledRepeatCount(): number {
    if (this.metadata) {
      return this.metadata.getMessageScheduledRepeatCount();
    }
    return 0;
  }

  getId(): string | null {
    if (this.metadata) {
      return this.metadata.getId();
    }
    return null;
  }

  getRequiredId(): string {
    if (!this.metadata) {
      throw new PanicError(`Message has not yet been published`);
    }
    return this.metadata.getId();
  }

  hasScheduledCronFired(): boolean {
    if (this.metadata) {
      return this.metadata.hasScheduledCronFired();
    }
    return false;
  }

  getSetExpired(): boolean {
    if (!this.metadata) {
      throw new PanicError(`Message has not yet been published`);
    }
    if (!this.metadata.hasExpired()) {
      const messageTTL = this.getTTL();
      if (messageTTL) {
        const curTime = new Date().getTime();
        const createdAt = this.getCreatedAt();
        const expired = createdAt + messageTTL - curTime <= 0;
        this.metadata.setExpired(expired);
        return expired;
      }
      return false;
    }
    return true;
  }

  ///

  incrMessageScheduledRepeatCount(): number {
    if (!this.metadata) {
      throw new PanicError(`Message has not yet been published`);
    }
    return this.metadata.incrMessageScheduledRepeatCount();
  }

  incrAttempts(): number {
    if (!this.metadata) {
      throw new PanicError(`Message has not yet been published`);
    }
    return this.metadata.incrAttempts();
  }

  setAttempts(attempts: number): Message {
    if (!this.metadata) {
      throw new PanicError(`Message has not yet been published`);
    }
    this.metadata.setAttempts(attempts);
    return this;
  }

  setScheduledAt(timestamp: number): Message {
    if (!this.metadata) {
      throw new PanicError(`Message has not yet been published`);
    }
    this.metadata.setScheduledAt(timestamp);
    return this;
  }

  resetMessageScheduledRepeatCount(): Message {
    if (!this.metadata) {
      throw new PanicError(`Message has not yet been published`);
    }
    this.metadata.resetMessageScheduledRepeatCount();
    return this;
  }

  setMessageScheduledCronFired(fired: boolean): Message {
    if (!this.metadata) {
      throw new PanicError(`Message has not yet been published`);
    }
    this.metadata.setMessageScheduledCronFired(fired);
    return this;
  }

  /**
   * @param period In millis
   */
  setScheduledPeriod(period: number): Message {
    if (period < 0)
      throw new ArgumentError(
        'Expected a positive integer value in milliseconds',
      );
    this.scheduledPeriod = period;
    return this;
  }

  /**
   * @param delay In millis
   */
  setScheduledDelay(delay: number): Message {
    if (delay < 0) {
      throw new ArgumentError(
        'Expected a positive integer value in milliseconds',
      );
    }
    this.scheduledDelay = delay;
    return this;
  }

  setScheduledCron(cron: string): Message {
    // it throws an exception for an invalid value
    parseExpression(cron);
    this.scheduledCron = cron;
    return this;
  }

  setScheduledRepeat(repeat: number): Message {
    this.scheduledRepeat = Number(repeat);
    return this;
  }

  /**
   * @param ttl In milliseconds
   */
  setTTL(ttl: number): Message {
    if (ttl < 0) {
      throw new ArgumentError(
        'Expected a positive integer value in milliseconds',
      );
    }
    this.ttl = ttl;
    return this;
  }

  /**
   * @param timeout In milliseconds
   */
  setConsumeTimeout(timeout: number): Message {
    if (timeout < 0) {
      throw new ArgumentError(
        'Expected a positive integer value in milliseconds',
      );
    }
    this.consumeTimeout = timeout;
    return this;
  }

  setRetryThreshold(threshold: number): Message {
    this.retryThreshold = Number(threshold);
    return this;
  }

  /**
   * @param delay In millis
   */
  setRetryDelay(delay: number): Message {
    if (delay < 0) {
      throw new ArgumentError('Delay should not be a negative number');
    }
    this.retryDelay = delay;
    return this;
  }

  setBody(body: unknown): Message {
    this.body = body;
    return this;
  }

  setPriority(priority: number): Message {
    if (!Object.values(Message.MessagePriority).includes(priority)) {
      throw new ArgumentError('Invalid message priority.');
    }
    this.priority = priority;
    return this;
  }

  setQueue(queue: string | TQueueParams): Message {
    this.queue = queueManager.getQueueParams(queue);
    return this;
  }

  disablePriority(): Message {
    this.priority = null;
    return this;
  }

  isWithPriority(): boolean {
    return this.priority !== null;
  }

  getQueue(): TQueueParams | null {
    return this.queue;
  }

  getPriority(): number | null {
    return this.priority;
  }

  getBody(): unknown {
    return this.body;
  }

  getTTL(): number {
    return this.ttl;
  }

  getRetryThreshold(): number {
    return this.retryThreshold;
  }

  getRetryDelay(): number {
    return this.retryDelay;
  }

  getConsumeTimeout(): number {
    return this.consumeTimeout;
  }

  getCreatedAt(): number {
    return this.createdAt;
  }

  getMessageScheduledRepeat(): number {
    return this.scheduledRepeat;
  }

  getMessageScheduledPeriod(): number | null {
    return this.scheduledPeriod;
  }

  getMessageScheduledCRON(): string | null {
    return this.scheduledCron;
  }

  getMessageScheduledDelay(): number | null {
    return this.scheduledDelay;
  }

  setNextRetryDelay(delay: number): Message {
    if (!this.metadata) {
      throw new PanicError(`Message has not yet been published`);
    }
    this.metadata.setNextRetryDelay(delay);
    return this;
  }

  getSetNextDelay(): number {
    if (this.metadata) {
      const retryDelay = this.metadata.getSetNextRetryDelay();
      if (retryDelay) {
        return retryDelay;
      }
      const scheduledDelay = this.metadata.getSetNextScheduledDelay();
      if (scheduledDelay) {
        return scheduledDelay;
      }
    }
    return 0;
  }

  hasNextDelay(): boolean {
    if (this.metadata) {
      return this.metadata.hasDelay();
    }
    return !!this.getMessageScheduledDelay();
  }

  getNextScheduledTimestamp(): number {
    if (this.isSchedulable()) {
      // Delay
      const delay = this.getSetNextDelay();
      if (delay) {
        return Date.now() + delay;
      }

      // CRON
      const msgScheduledCron = this.getMessageScheduledCRON();
      const cronTimestamp = msgScheduledCron
        ? parseExpression(msgScheduledCron).next().getTime()
        : 0;

      // Repeat
      const msgScheduledRepeat = this.getMessageScheduledRepeat();
      let repeatTimestamp = 0;
      if (msgScheduledRepeat) {
        const newCount = this.getMessageScheduledRepeatCount() + 1;
        if (newCount <= msgScheduledRepeat) {
          const msgScheduledPeriod = this.getMessageScheduledPeriod();
          const now = Date.now();
          if (msgScheduledPeriod) {
            repeatTimestamp = now + msgScheduledPeriod;
          } else {
            repeatTimestamp = now;
          }
        }
      }

      if (repeatTimestamp && cronTimestamp) {
        if (repeatTimestamp < cronTimestamp && this.hasScheduledCronFired()) {
          this.incrMessageScheduledRepeatCount();
          return repeatTimestamp;
        }
      }

      if (cronTimestamp) {
        // reset repeat count on each cron tick
        this.resetMessageScheduledRepeatCount();

        // if the message has also a repeat scheduling then the first time it will fires only
        // after CRON scheduling has been fired
        this.setMessageScheduledCronFired(true);

        return cronTimestamp;
      }

      if (repeatTimestamp) {
        this.incrMessageScheduledRepeatCount();
        return repeatTimestamp;
      }
    }
    return 0;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  hasRetryThresholdExceeded(): boolean {
    const metadata = this.getMetadata();
    if (!metadata) {
      return false;
    }
    const threshold = this.getRetryThreshold();
    return metadata.getAttempts() + 1 >= threshold;
  }

  isSchedulable(): boolean {
    return this.hasNextDelay() || this.isPeriodic();
  }

  isPeriodic(): boolean {
    return (
      this.getMessageScheduledCRON() !== null ||
      this.getMessageScheduledRepeat() > 0
    );
  }

  static createFromMessage(message: string | Message, reset = false): Message {
    const messageJSON: Message =
      typeof message === 'string' ? JSON.parse(message) : message;
    const m = new Message();
    Object.assign(m, messageJSON, {
      metadata: messageJSON.metadata
        ? Object.assign(new MessageMetadata(), messageJSON.metadata)
        : null,
    });
    if (reset) {
      const metadata = m.getMetadata();
      if (metadata) {
        metadata.reset();
      }
    }
    return m;
  }
}
