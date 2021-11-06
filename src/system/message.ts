import { v4 as uuid } from 'uuid';
import { parseExpression } from 'cron-parser';
import { TMessageDefaultOptions, TMessageQueue } from '../../types';

export class Message {
  protected static defaultOpts: TMessageDefaultOptions = {
    consumeTimeout: 0,
    retryThreshold: 3,
    retryDelay: 60000,
    ttl: 0,
  };

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

  protected createdAt: number;

  protected ttl: number;

  protected retryThreshold: number;

  protected retryDelay: number;

  protected consumeTimeout: number;

  protected body: unknown = null;

  protected priority: number | null = null;

  protected scheduledCron: string | null = null;

  protected scheduledDelay: number | null = null;

  protected scheduledPeriod: number | null = null;

  protected scheduledRepeat = 0;

  ///

  protected scheduledCronFired = false;

  protected attempts = 0;

  protected scheduledRepeatCount = 0;

  protected delayed = false;

  protected expired = false;

  protected queue: TMessageQueue | null = null;

  ///

  constructor() {
    this.createdAt = Date.now();
    this.uuid = uuid();
    this.attempts = 0;
    this.scheduledRepeatCount = 0;
    this.delayed = false;
    this.ttl = Message.defaultOpts.ttl;
    this.retryDelay = Message.defaultOpts.retryDelay;
    this.retryThreshold = Message.defaultOpts.retryThreshold;
    this.consumeTimeout = Message.defaultOpts.consumeTimeout;
  }

  /**
   * @param period In millis
   */
  setScheduledPeriod(period: number): Message {
    if (period < 1000)
      throw new Error('Scheduling period should not be less than 1 second');
    this.scheduledPeriod = period;
    return this;
  }

  /**
   * @param delay In millis
   */
  setScheduledDelay(delay: number): Message {
    if (delay < 1000) {
      throw new Error('Scheduling delay should not be less than 1 second');
    }
    this.scheduledDelay = delay;
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
    if (ttl && ttl < 1000) {
      throw new Error('TTL should not be less than 1 second');
    }
    this.ttl = Number(ttl);
    return this;
  }

  /**
   * @param timeout In milliseconds
   */
  setConsumeTimeout(timeout: number): Message {
    if (timeout && timeout < 1000) {
      throw new Error('Timeout should not be less than 1 second');
    }
    this.consumeTimeout = Number(timeout);
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
    if (delay && delay < 1000) {
      throw new Error('Delay should not be less than 1 second');
    }
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

  setQueue(ns: string, name: string): Message {
    this.queue = {
      name,
      ns,
    };
    return this;
  }

  getQueue(): TMessageQueue | null {
    return this.queue;
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
    if (!this.expired) {
      const messageTTL = this.getTTL();
      if (messageTTL) {
        const curTime = new Date().getTime();
        const createdAt = this.getCreatedAt();
        this.expired = createdAt + messageTTL - curTime <= 0;
      }
    }
    return this.expired;
  }

  hasRetryThresholdExceeded(): boolean {
    const threshold = this.getRetryThreshold();
    if (threshold) {
      return this.getAttempts() + 1 >= threshold;
    }
    return false;
  }

  reset(hardReset = false): Message {
    if (hardReset) {
      this.delayed = false;
      this.scheduledCronFired = false;
      this.scheduledRepeatCount = 0;
    }
    this.attempts = 0;
    this.expired = false;
    return this;
  }

  getSetPriority(priority: number | undefined): number {
    const defaultPriority = priority ?? Message.MessagePriority.NORMAL;
    if (!Object.values(Message.MessagePriority).includes(defaultPriority)) {
      throw new Error(`Invalid message priority`);
    }
    const msgPriority = this.getPriority() ?? defaultPriority;
    if (msgPriority !== this.getPriority()) {
      this.setPriority(msgPriority);
    }
    return msgPriority;
  }

  isSchedulable(): boolean {
    return (
      this.getMessageScheduledCRON() !== null ||
      this.getMessageScheduledDelay() !== null ||
      this.getMessageScheduledRepeat() > 0
    );
  }

  isPeriodic(): boolean {
    return (
      this.getMessageScheduledCRON() !== null ||
      this.getMessageScheduledRepeat() > 0
    );
  }

  static createFromMessage(
    message: string | Message,
    reset = false,
    hardReset = false,
  ): Message {
    const messageJSON: Message =
      typeof message === 'string' ? JSON.parse(message) : message;
    const m = new Message();
    Object.assign(m, messageJSON);
    if (reset) m.reset(hardReset);
    return m;
  }

  static setDefaultOptions(
    options: Partial<TMessageDefaultOptions> = {},
  ): void {
    if (options.consumeTimeout && options.consumeTimeout < 1000) {
      throw new Error('Timeout should not be less than 1 second');
    }
    if (options.retryDelay && options.retryDelay < 1000) {
      throw new Error('Delay should not be less than 1 second');
    }
    if (options.ttl && options.ttl < 1000) {
      throw new Error('TTL should not be less than 1 second');
    }
    Message.defaultOpts = {
      ...Message.defaultOpts,
      ...options,
    };
  }
}
