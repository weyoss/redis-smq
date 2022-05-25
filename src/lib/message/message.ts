import { parseExpression } from 'cron-parser';
import {
  TMessageConsumeOptions,
  TMessageJSON,
  TQueueParams,
} from '../../../types';
import { MessageMetadata } from './message-metadata';
import { errors } from 'redis-smq-common';
import { redisKeys } from '../../common/redis-keys/redis-keys';

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

  protected static defaultConsumeOptions: TMessageConsumeOptions = {
    ttl: 0,
    retryThreshold: 3,
    retryDelay: 60000,
    consumeTimeout: 0,
  };

  protected readonly createdAt: number;

  protected queue: string | TQueueParams | null = null;

  protected ttl = 0;

  protected retryThreshold = 3;

  protected retryDelay = 60000;

  protected consumeTimeout = 0;

  protected body: unknown = null;

  protected priority: number | null = null;

  protected scheduledCron: string | null = null;

  protected scheduledDelay: number | null = null;

  protected scheduledRepeatPeriod: number | null = null;

  protected scheduledRepeat = 0;

  protected metadata: MessageMetadata | null = null;

  constructor() {
    this.createdAt = Date.now();
    const { consumeTimeout, retryDelay, ttl, retryThreshold } =
      Message.defaultConsumeOptions;
    this.setConsumeTimeout(consumeTimeout);
    this.setRetryDelay(retryDelay);
    this.setTTL(ttl);
    this.setRetryThreshold(retryThreshold);
  }

  getMetadata(): MessageMetadata | null {
    return this.metadata;
  }

  getRequiredMetadata(): MessageMetadata {
    if (!this.metadata) {
      throw new errors.PanicError(
        `Expected an instance of MessageMetadata. Probably the message has not yet been published`,
      );
    }
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

  getId(): string | null {
    if (this.metadata) {
      return this.metadata.getId();
    }
    return null;
  }

  getRequiredId(): string {
    if (!this.metadata) {
      throw new errors.PanicError(`Message has not yet been published`);
    }
    return this.metadata.getId();
  }

  getSetExpired(): boolean {
    return this.getRequiredMetadata().getSetExpired(
      this.getTTL(),
      this.getCreatedAt(),
    );
  }

  ///

  /**
   * @param period In millis
   */
  setScheduledRepeatPeriod(period: number): Message {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(period);
    if (isNaN(value) || value < 0) {
      throw new errors.ArgumentError(
        'Expected a positive integer value in milliseconds',
      );
    }
    this.scheduledRepeatPeriod = value;
    return this;
  }

  /**
   * @param delay In millis
   */
  setScheduledDelay(delay: number): Message {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(delay);
    if (isNaN(value) || value < 0) {
      throw new errors.ArgumentError(
        'Expected a positive integer value in milliseconds',
      );
    }
    this.scheduledDelay = value;
    return this;
  }

  setScheduledCRON(cron: string): Message {
    // it throws an exception for an invalid value
    parseExpression(cron);
    this.scheduledCron = cron;
    return this;
  }

  setScheduledRepeat(repeat: number): Message {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(repeat);
    if (isNaN(value) || value < 0) {
      throw new errors.ArgumentError('Expected a positive integer value >= 0');
    }
    this.scheduledRepeat = value;
    return this;
  }

  /**
   * @param ttl In milliseconds
   */
  setTTL(ttl: number): Message {
    this.ttl = Message.validateTTL(ttl);
    return this;
  }

  /**
   * @param timeout In milliseconds
   */
  setConsumeTimeout(timeout: number): Message {
    this.consumeTimeout = Message.validateConsumeTimeout(timeout);
    return this;
  }

  setRetryThreshold(threshold: number): Message {
    this.retryThreshold = Message.validateRetryThreshold(threshold);
    return this;
  }

  /**
   * @param delay In millis
   */
  setRetryDelay(delay: number): Message {
    this.retryDelay = Message.validateRetryDelay(delay);
    return this;
  }

  setBody(body: unknown): Message {
    this.body = body;
    return this;
  }

  setPriority(priority: number): Message {
    if (!Object.values(Message.MessagePriority).includes(priority)) {
      throw new errors.ArgumentError('Invalid message priority.');
    }
    this.priority = priority;
    return this;
  }

  setQueue(queue: string | TQueueParams): Message {
    this.queue =
      typeof queue === 'string'
        ? redisKeys.validateRedisKey(queue)
        : {
            name: redisKeys.validateRedisKey(queue.name),
            ns: redisKeys.validateNamespace(queue.ns),
          };
    return this;
  }

  disablePriority(): Message {
    this.priority = null;
    return this;
  }

  hasPriority(): boolean {
    return this.priority !== null;
  }

  getQueue(): TQueueParams | string | null {
    return this.queue;
  }

  getRequiredQueue(): TQueueParams {
    if (!this.queue) {
      throw new errors.PanicError(`Expected queue parameters to be not empty`);
    }
    if (typeof this.queue === 'string') {
      throw new errors.PanicError(
        `Expected queue parameters to be not a string`,
      );
    }
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

  getScheduledRepeat(): number {
    return this.scheduledRepeat;
  }

  getScheduledRepeatPeriod(): number | null {
    return this.scheduledRepeatPeriod;
  }

  getScheduledCRON(): string | null {
    return this.scheduledCron;
  }

  getMessageScheduledDelay(): number | null {
    return this.scheduledDelay;
  }

  hasNextDelay(): boolean {
    if (this.metadata) {
      return this.metadata.hasDelay();
    }
    return !!this.getMessageScheduledDelay();
  }

  getNextScheduledTimestamp(): number {
    if (this.isSchedulable()) {
      const metadata = this.getRequiredMetadata();

      // Delay
      const delay = metadata.getSetNextDelay();
      if (delay) {
        return Date.now() + delay;
      }

      // CRON
      const msgScheduledCron = this.getScheduledCRON();
      const cronTimestamp = msgScheduledCron
        ? parseExpression(msgScheduledCron).next().getTime()
        : 0;

      // Repeat
      const msgScheduledRepeat = this.getScheduledRepeat();
      let repeatTimestamp = 0;
      if (msgScheduledRepeat) {
        const newCount = metadata.getMessageScheduledRepeatCount() + 1;
        if (newCount <= msgScheduledRepeat) {
          const scheduledRepeatPeriod = this.getScheduledRepeatPeriod();
          const now = Date.now();
          if (scheduledRepeatPeriod) {
            repeatTimestamp = now + scheduledRepeatPeriod;
          } else {
            repeatTimestamp = now;
          }
        }
      }

      if (repeatTimestamp && cronTimestamp) {
        if (
          repeatTimestamp < cronTimestamp &&
          metadata.hasScheduledCronFired()
        ) {
          metadata.incrMessageScheduledRepeatCount();
          return repeatTimestamp;
        }
      }

      if (cronTimestamp) {
        // reset repeat count on each cron tick
        metadata.resetMessageScheduledRepeatCount();

        // if the message has also a repeat scheduling then the first time it will fires only
        // after CRON scheduling has been fired
        metadata.setMessageScheduledCronFired(true);

        return cronTimestamp;
      }

      if (repeatTimestamp) {
        metadata.incrMessageScheduledRepeatCount();
        return repeatTimestamp;
      }
    }
    return 0;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  toJSON(): TMessageJSON {
    return {
      createdAt: this.createdAt,
      queue: typeof this.queue === 'string' ? null : this.queue,
      ttl: this.ttl,
      retryThreshold: this.retryThreshold,
      retryDelay: this.retryDelay,
      consumeTimeout: this.consumeTimeout,
      body: this.body,
      priority: this.priority,
      scheduledCron: this.scheduledCron,
      scheduledDelay: this.scheduledDelay,
      scheduledRepeatPeriod: this.scheduledRepeatPeriod,
      scheduledRepeat: this.scheduledRepeat,
      metadata: this.metadata ? this.metadata.toJSON() : null,
    };
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
    return this.getScheduledCRON() !== null || this.getScheduledRepeat() > 0;
  }

  protected static validateRetryDelay(delay: number): number {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(delay);
    if (isNaN(value) || value < 0) {
      throw new errors.ArgumentError(
        'Expected a positive integer in milliseconds >= 0',
      );
    }
    return value;
  }
  protected static validateTTL(ttl: unknown): number {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(ttl);
    if (isNaN(value) || value < 0) {
      throw new errors.ArgumentError(
        'Expected a positive integer value in milliseconds >= 0',
      );
    }
    return value;
  }

  protected static validateConsumeTimeout(timeout: unknown): number {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(timeout);
    if (isNaN(value) || value < 0) {
      throw new errors.ArgumentError(
        'Expected a positive integer value in milliseconds >= 0',
      );
    }
    return value;
  }

  protected static validateRetryThreshold(threshold: unknown): number {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(threshold);
    if (isNaN(value) || value < 0) {
      throw new errors.ArgumentError(
        'Retry threshold should be a positive integer >= 0',
      );
    }
    return value;
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

  static setDefaultConsumeOptions(
    consumeOptions: Partial<TMessageConsumeOptions>,
  ): void {
    const {
      ttl = null,
      retryThreshold = null,
      retryDelay = null,
      consumeTimeout = null,
    } = consumeOptions;

    if (ttl !== null)
      Message.defaultConsumeOptions.ttl = Message.validateTTL(ttl);

    if (retryDelay !== null)
      Message.defaultConsumeOptions.retryDelay =
        Message.validateRetryDelay(retryDelay);

    if (retryThreshold !== null)
      Message.defaultConsumeOptions.retryThreshold =
        Message.validateRetryThreshold(retryThreshold);

    if (consumeTimeout !== null)
      Message.defaultConsumeOptions.consumeTimeout =
        Message.validateConsumeTimeout(consumeTimeout);
  }
}
