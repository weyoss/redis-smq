import { parseExpression } from 'cron-parser';
import {
  EExchangeType,
  TMessageConsumeOptions,
  TExchange,
  TMessageJSON,
  TQueueParams,
  TTopicParams,
} from '../../../types';
import { MessageState } from './message-state';
import { MessageError } from './errors/message.error';
import { DirectExchange } from '../exchange/direct-exchange';
import { TopicExchange } from '../exchange/topic-exchange';
import { FanOutExchange } from '../exchange/fan-out-exchange';
import { MessageExchangeRequiredError } from './errors/message-exchange-required.error';

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

  protected messageState: MessageState | null = null;

  protected exchange: TExchange | null = null;

  constructor() {
    this.createdAt = Date.now();
    const { consumeTimeout, retryDelay, ttl, retryThreshold } =
      Message.defaultConsumeOptions;
    this.setConsumeTimeout(consumeTimeout);
    this.setRetryDelay(retryDelay);
    this.setTTL(ttl);
    this.setRetryThreshold(retryThreshold);
  }

  getMessageState(): MessageState | null {
    return this.messageState;
  }

  getRequiredMessageState(): MessageState {
    if (!this.messageState) {
      throw new MessageError(
        `Expected an instance of MessageState. Probably the message has not yet been published`,
      );
    }
    return this.messageState;
  }

  setMessageState(m: MessageState): Message {
    this.messageState = m;
    return this;
  }

  getSetMessageState(): MessageState {
    if (!this.messageState) {
      const m = new MessageState();
      if (this.scheduledDelay) m.setNextScheduledDelay(this.scheduledDelay);
      this.setMessageState(m);
      return m;
    }
    return this.messageState;
  }

  ///

  getPublishedAt(): number | null {
    if (this.messageState) {
      return this.messageState.getPublishedAt();
    }
    return null;
  }

  getScheduledAt(): number | null {
    if (this.messageState) {
      return this.messageState.getScheduledAt();
    }
    return null;
  }

  getId(): string | null {
    if (this.messageState) {
      return this.messageState.getId();
    }
    return null;
  }

  getRequiredId(): string {
    if (!this.messageState) {
      throw new MessageError(`Message has not yet been published`);
    }
    return this.messageState.getId();
  }

  getSetExpired(): boolean {
    return this.getRequiredMessageState().getSetExpired(
      this.getTTL(),
      this.getCreatedAt(),
    );
  }

  ///

  setExchange(exchange: TExchange): Message {
    this.exchange = exchange;
    return this;
  }

  /**
   * @param period In millis
   */
  setScheduledRepeatPeriod(period: number): Message {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(period);
    if (isNaN(value) || value < 0) {
      throw new MessageError(
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
      throw new MessageError(
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
      throw new MessageError('Expected a positive integer value >= 0');
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
      throw new MessageError('Invalid message priority.');
    }
    this.priority = priority;
    return this;
  }

  setFanOut(bindingKey: string): Message {
    this.exchange = new FanOutExchange(bindingKey);
    return this;
  }

  setTopic(topicParams: string | TTopicParams): Message {
    this.exchange = new TopicExchange(topicParams);
    return this;
  }

  setQueue(queueParams: string | TQueueParams): Message {
    this.exchange = new DirectExchange(queueParams);
    return this;
  }

  setDestinationQueue(queue: TQueueParams): Message {
    const exchange = this.getRequiredExchange();
    exchange.setDestinationQueue(queue);
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
    if (this.exchange instanceof DirectExchange) {
      return this.exchange.getBindingParams();
    }
    return null;
  }

  getTopic(): TTopicParams | string | null {
    if (this.exchange instanceof TopicExchange) {
      return this.exchange.getBindingParams();
    }
    return null;
  }

  getFanOutParams(): string | null {
    if (this.exchange instanceof FanOutExchange) {
      return this.exchange.getBindingParams();
    }
    return null;
  }

  getDestinationQueue(): TQueueParams {
    const exchange = this.getRequiredExchange();
    return exchange.getRequiredDestinationQueue();
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
    if (this.messageState) {
      return this.messageState.hasDelay();
    }
    return !!this.getMessageScheduledDelay();
  }

  getNextScheduledTimestamp(): number {
    if (this.isSchedulable()) {
      const messageState = this.getRequiredMessageState();

      // Delay
      const delay = messageState.getSetNextDelay();
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
        const newCount = messageState.getMessageScheduledRepeatCount() + 1;
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
          messageState.hasScheduledCronFired()
        ) {
          messageState.incrMessageScheduledRepeatCount();
          return repeatTimestamp;
        }
      }

      if (cronTimestamp) {
        // reset repeat count on each cron tick
        messageState.resetMessageScheduledRepeatCount();

        // if the message has also a repeat scheduling then the first time it will fires only
        // after CRON scheduling has been fired
        messageState.setMessageScheduledCronFired(true);

        return cronTimestamp;
      }

      if (repeatTimestamp) {
        messageState.incrMessageScheduledRepeatCount();
        return repeatTimestamp;
      }
    }
    return 0;
  }

  getExchange(): TExchange | null {
    return this.exchange;
  }

  getRequiredExchange(): TExchange {
    if (!this.exchange) {
      throw new MessageExchangeRequiredError();
    }
    return this.exchange;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  toJSON(): TMessageJSON {
    return {
      createdAt: this.createdAt,
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
      messageState: this.messageState ? this.messageState.toJSON() : null,
      queue: this.exchange ? this.exchange.getDestinationQueue() : null,
      exchange: this.exchange ? this.exchange.toJSON() : null,
    };
  }

  hasRetryThresholdExceeded(): boolean {
    const messageState = this.getMessageState();
    if (!messageState) {
      return false;
    }
    const threshold = this.getRetryThreshold();
    return messageState.getAttempts() + 1 >= threshold;
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
      throw new MessageError(
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
      throw new MessageError(
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
      throw new MessageError(
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
      throw new MessageError(
        'Retry threshold should be a positive integer >= 0',
      );
    }
    return value;
  }

  static createFromMessage(
    message: string | Message,
    hardReset = false,
  ): Message {
    const { exchange, messageState, queue, ...params }: TMessageJSON =
      typeof message === 'string' ? JSON.parse(message) : message.toJSON();
    const m = new Message();
    Object.assign(m, params);
    if (messageState) {
      const meta = new MessageState();
      if (!hardReset) Object.assign(meta, messageState);
      m.setMessageState(meta);
    }
    if (exchange) {
      if (exchange['type'] === EExchangeType.DIRECT) {
        m.setExchange(DirectExchange.fromJSON(exchange));
      } else if (exchange['type'] === EExchangeType.FANOUT) {
        m.setExchange(FanOutExchange.fromJSON(exchange));
      } else {
        m.setExchange(TopicExchange.fromJSON(exchange));
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
