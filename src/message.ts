import { v4 as uuid } from 'uuid';
import { parseExpression } from 'cron-parser';

export class Message {
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

  constructor() {
    this.createdAt = Date.now();
    this.uuid = uuid();
    this.attempts = 0;
    this.scheduledRepeatCount = 0;
    this.delayed = false;
  }

  setScheduledPeriod(period: number): Message {
    if (period < 1)
      throw new Error('Scheduling period should not be less than 1 second');
    this.scheduledPeriod = period * 1000; // in ms
    return this;
  }

  setScheduledDelay(delay: number): Message {
    if (delay < 1) {
      throw new Error('Scheduling delay should not be less than 1 second');
    }
    this.scheduledDelay = delay * 1000; // in ms
    this.delayed = false;
    return this;
  }

  setScheduledCron(cron: string): Message {
    // throws an exception for invalid value
    parseExpression(cron);
    this.scheduledCron = cron;
    return this;
  }

  setScheduledRepeat(repeat: number): Message {
    this.scheduledRepeat = Number(repeat);
    return this;
  }

  setTTL(ttl: number): Message {
    this.ttl = Number(ttl);
    return this;
  }

  setConsumeTimeout(timeout: number): Message {
    this.consumeTimeout = Number(timeout);
    return this;
  }

  setRetryThreshold(threshold: number): Message {
    this.retryThreshold = Number(threshold);
    return this;
  }

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

  getBody() {
    return this.body;
  }

  getId() {
    return this.uuid;
  }

  getTTL() {
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
