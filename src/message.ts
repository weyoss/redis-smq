import { v4 as uuid } from 'uuid';
import { parseExpression } from 'cron-parser';

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

  protected uuid: string;

  protected attempts: number;

  protected createdAt: number;

  protected ttl: number | null = null;

  protected retryThreshold: number | null = null;

  protected retryDelay: number | null = null;

  protected consumeTimeout: number | null = null;

  protected body: unknown = null;

  protected scheduledCron: string | null = null;

  protected scheduledCronFired = false;

  // The time in milliseconds that a message will wait before being scheduled to be delivered
  protected scheduledDelay: number | null = null;

  // The time in milliseconds to wait after the start time to wait before scheduling the message again
  protected scheduledPeriod: number | null = null;

  // The number of times to repeat scheduling a message for delivery
  protected scheduledRepeat = 0;

  protected scheduledRepeatCount = 0;

  protected delayed = false;

  protected priority: number | null = null;

  constructor() {
    this.createdAt = Date.now();
    this.uuid = uuid();
    this.attempts = 0;
    this.scheduledRepeatCount = 0;
    this.delayed = false;
  }

  /**
   * @param period In seconds
   */
  setScheduledPeriod(period: number): Message {
    if (period < 1)
      throw new Error('Scheduling period should not be less than 1 second');
    this.scheduledPeriod = period * 1000; // in ms
    return this;
  }

  /**
   * @param delay In seconds
   */
  setScheduledDelay(delay: number): Message {
    if (delay < 1) {
      throw new Error('Scheduling delay should not be less than 1 second');
    }
    this.scheduledDelay = delay * 1000; // in ms
    this.delayed = false;
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
    this.ttl = Number(ttl);
    return this;
  }

  /**
   * @param timeout In milliseconds
   */
  setConsumeTimeout(timeout: number): Message {
    this.consumeTimeout = Number(timeout);
    return this;
  }

  setRetryThreshold(threshold: number): Message {
    this.retryThreshold = Number(threshold);
    return this;
  }

  /**
   * @param delay In seconds
   */
  setRetryDelay(delay: number): Message {
    this.retryDelay = Number(delay);
    return this;
  }

  setAttempts(attempts: number): Message {
    this.attempts = attempts;
    return this;
  }

  incrAttempts(): number {
    this.setAttempts(this.attempts + 1);
    return this.attempts;
  }

  setBody(body: unknown): Message {
    this.body = body;
    return this;
  }

  setMessageScheduledRepeatCount(count: number): Message {
    this.scheduledRepeatCount = count;
    return this;
  }

  setMessageScheduledCronFired(fired: boolean): Message {
    this.scheduledCronFired = fired;
    return this;
  }

  incrMessageScheduledRepeatCount(): number {
    this.scheduledRepeatCount += 1;
    return this.scheduledRepeatCount;
  }

  resetMessageScheduledRepeatCount(): Message {
    this.scheduledRepeatCount = 0;
    return this;
  }

  setMessageDelayed(delayed: boolean): Message {
    this.delayed = delayed;
    return this;
  }

  setPriority(priority: number): Message {
    if (!Object.values(Message.MessagePriority).includes(priority)) {
      throw new Error('Invalid message priority.');
    }
    this.priority = priority;
    return this;
  }

  getPriority(): number | null {
    return this.priority;
  }

  getBody(): unknown {
    return this.body;
  }

  getId(): string {
    return this.uuid;
  }

  getTTL(): number | null {
    return this.ttl;
  }

  getRetryThreshold(): number | null {
    return this.retryThreshold;
  }

  getRetryDelay(): number | null {
    return this.retryDelay;
  }

  getConsumeTimeout(): number | null {
    return this.consumeTimeout;
  }

  getCreatedAt(): number {
    return this.createdAt;
  }

  getAttempts(): number {
    return this.attempts;
  }

  getMessageScheduledRepeat(): number {
    return this.scheduledRepeat;
  }

  getMessageScheduledRepeatCount(): number {
    return this.scheduledRepeatCount;
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

  isDelayed(): boolean {
    return this.delayed;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  hasScheduledCronFired(): boolean {
    return this.scheduledCronFired;
  }

  hasExpired(): boolean {
    const messageTTL = this.getTTL();
    if (messageTTL) {
      const curTime = new Date().getTime();
      const createdAt = this.getCreatedAt();
      return createdAt + messageTTL - curTime <= 0;
    }
    return false;
  }

  hasRetryThresholdExceeded(): boolean {
    const threshold = this.getRetryThreshold();
    if (threshold) {
      const attempts = this.getAttempts() + 1;
      return attempts > threshold;
    }
    return false;
  }

  static createFromMessage(message: string | Message, reset = false): Message {
    const messageJSON: Message =
      typeof message === 'string' ? JSON.parse(message) : message;
    const m = new Message();
    Object.assign(m, messageJSON);
    if (reset) {
      m.uuid = uuid();
      m.attempts = 0;
      m.createdAt = Date.now();
    }
    return m;
  }
}
