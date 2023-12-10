/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { parseExpression } from 'cron-parser';
import {
  EMessagePropertyStatus,
  IMessageSerialized,
  IQueueParams,
  TExchange,
  TMessageConsumeOptions,
  TTopicParams,
} from '../../../types';
import { MessageState } from './message-state';
import {
  MessageDestinationQueueAlreadySetError,
  MessageDestinationQueueRequiredError,
  MessageError,
  MessageExchangeRequiredError,
} from './errors';
import { ExchangeDirect } from '../exchange/exchange-direct';
import { ExchangeFanOut } from '../exchange/exchange-fan-out';
import { ExchangeTopic } from '../exchange/exchange-topic';

export class MessageEnvelope {
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

  protected destinationQueue: IQueueParams | null = null;

  protected status: EMessagePropertyStatus = EMessagePropertyStatus.UNPUBLISHED;

  constructor() {
    this.createdAt = Date.now();
    const { consumeTimeout, retryDelay, ttl, retryThreshold } =
      MessageEnvelope.defaultConsumeOptions;
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

  setMessageState(m: MessageState): MessageEnvelope {
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

  getScheduledMessageId(): string | null {
    if (this.messageState) {
      return this.messageState.getScheduledMessageId();
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

  getStatus(): EMessagePropertyStatus {
    return this.status;
  }

  ///

  setExchange(exchange: TExchange): MessageEnvelope {
    this.exchange = exchange;
    return this;
  }

  /**
   * @param period In millis
   */
  setScheduledRepeatPeriod(period: number): MessageEnvelope {
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
  setScheduledDelay(delay: number): MessageEnvelope {
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

  setScheduledCRON(cron: string): MessageEnvelope {
    // it throws an exception for an invalid value
    parseExpression(cron);
    this.scheduledCron = cron;
    return this;
  }

  setScheduledRepeat(repeat: number): MessageEnvelope {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(repeat);
    if (isNaN(value) || value < 0) {
      throw new MessageError('Expected a positive integer value >= 0');
    }
    this.scheduledRepeat = value;
    return this;
  }

  resetScheduledParams(): MessageEnvelope {
    this.scheduledCron = null;
    this.scheduledDelay = null;
    this.scheduledRepeatPeriod = null;
    this.scheduledRepeat = 0;
    return this;
  }

  /**
   * @param ttl In milliseconds
   */
  setTTL(ttl: number): MessageEnvelope {
    this.ttl = MessageEnvelope.validateTTL(ttl);
    return this;
  }

  /**
   * @param timeout In milliseconds
   */
  setConsumeTimeout(timeout: number): MessageEnvelope {
    this.consumeTimeout = MessageEnvelope.validateConsumeTimeout(timeout);
    return this;
  }

  setRetryThreshold(threshold: number): MessageEnvelope {
    this.retryThreshold = MessageEnvelope.validateRetryThreshold(threshold);
    return this;
  }

  /**
   * @param delay In millis
   */
  setRetryDelay(delay: number): MessageEnvelope {
    this.retryDelay = MessageEnvelope.validateRetryDelay(delay);
    return this;
  }

  setBody(body: unknown): MessageEnvelope {
    this.body = body;
    return this;
  }

  setPriority(priority: number): MessageEnvelope {
    if (!Object.values(MessageEnvelope.MessagePriority).includes(priority)) {
      throw new MessageError('Invalid message priority.');
    }
    this.priority = priority;
    return this;
  }

  setFanOut(bindingKey: string): MessageEnvelope {
    this.exchange = new ExchangeFanOut(bindingKey);
    return this;
  }

  setTopic(topicParams: string | TTopicParams): MessageEnvelope {
    this.exchange = new ExchangeTopic(topicParams);
    return this;
  }

  setQueue(queueParams: string | IQueueParams): MessageEnvelope {
    this.exchange = new ExchangeDirect(queueParams);
    return this;
  }

  setDestinationQueue(queue: IQueueParams): MessageEnvelope {
    if (this.destinationQueue !== null) {
      throw new MessageDestinationQueueAlreadySetError();
    }
    this.destinationQueue = queue;
    return this;
  }

  disablePriority(): MessageEnvelope {
    this.priority = null;
    return this;
  }

  hasPriority(): boolean {
    return this.priority !== null;
  }

  setStatus(s: EMessagePropertyStatus): MessageEnvelope {
    this.status = s;
    return this;
  }

  getQueue(): IQueueParams | string | null {
    if (this.exchange instanceof ExchangeDirect) {
      return this.exchange.getBindingParams();
    }
    return null;
  }

  getDestinationQueue(): IQueueParams {
    if (!this.destinationQueue) {
      throw new MessageDestinationQueueRequiredError();
    }
    return this.destinationQueue;
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

  toJSON(): IMessageSerialized {
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
      exchange: this.exchange ? this.exchange.toJSON() : null,
      destinationQueue: this.destinationQueue,
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
    const value = Number(delay);
    if (isNaN(value) || value < 0) {
      throw new MessageError(
        'Expected a positive integer in milliseconds >= 0',
      );
    }
    return value;
  }
  protected static validateTTL(ttl: unknown): number {
    const value = Number(ttl);
    if (isNaN(value) || value < 0) {
      throw new MessageError(
        'Expected a positive integer value in milliseconds >= 0',
      );
    }
    return value;
  }

  protected static validateConsumeTimeout(timeout: unknown): number {
    const value = Number(timeout);
    if (isNaN(value) || value < 0) {
      throw new MessageError(
        'Expected a positive integer value in milliseconds >= 0',
      );
    }
    return value;
  }

  protected static validateRetryThreshold(threshold: unknown): number {
    const value = Number(threshold);
    if (isNaN(value) || value < 0) {
      throw new MessageError(
        'Retry threshold should be a positive integer >= 0',
      );
    }
    return value;
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
      MessageEnvelope.defaultConsumeOptions.ttl =
        MessageEnvelope.validateTTL(ttl);

    if (retryDelay !== null)
      MessageEnvelope.defaultConsumeOptions.retryDelay =
        MessageEnvelope.validateRetryDelay(retryDelay);

    if (retryThreshold !== null)
      MessageEnvelope.defaultConsumeOptions.retryThreshold =
        MessageEnvelope.validateRetryThreshold(retryThreshold);

    if (consumeTimeout !== null)
      MessageEnvelope.defaultConsumeOptions.consumeTimeout =
        MessageEnvelope.validateConsumeTimeout(consumeTimeout);
  }
}
