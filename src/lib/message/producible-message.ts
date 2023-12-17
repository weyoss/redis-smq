/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import {
  EMessagePriority,
  IQueueParams,
  TExchange,
  TMessageConsumeOptions,
  TTopicParams,
} from '../../../types';
import { MessageError } from './errors';
import { parseExpression } from 'cron-parser';
import { ExchangeFanOut } from '../exchange/exchange-fan-out';
import { ExchangeTopic } from '../exchange/exchange-topic';
import { ExchangeDirect } from '../exchange/exchange-direct';

export class ProducibleMessage {
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

  protected priority: EMessagePriority | null = null;

  protected scheduledCron: string | null = null;

  protected scheduledDelay: number | null = null;

  protected scheduledRepeatPeriod: number | null = null;

  protected scheduledRepeat = 0;

  protected exchange: TExchange | null = null;

  constructor() {
    this.createdAt = Date.now();
    const { consumeTimeout, retryDelay, ttl, retryThreshold } =
      ProducibleMessage.defaultConsumeOptions;
    this.setConsumeTimeout(consumeTimeout);
    this.setRetryDelay(retryDelay);
    this.setTTL(ttl);
    this.setRetryThreshold(retryThreshold);
  }

  getCreatedAt(): number {
    return this.createdAt;
  }

  /**
   * @param period In millis
   */
  setScheduledRepeatPeriod(period: number): ProducibleMessage {
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
  setScheduledDelay(delay: number): ProducibleMessage {
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

  getScheduledDelay(): number | null {
    return this.scheduledDelay;
  }

  setScheduledCRON(cron: string): ProducibleMessage {
    // it throws an exception for an invalid value
    parseExpression(cron);
    this.scheduledCron = cron;
    return this;
  }

  setScheduledRepeat(repeat: number): ProducibleMessage {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(repeat);
    if (isNaN(value) || value < 0) {
      throw new MessageError('Expected a positive integer value >= 0');
    }
    this.scheduledRepeat = value;
    return this;
  }

  resetScheduledParams(): ProducibleMessage {
    this.scheduledCron = null;
    this.scheduledDelay = null;
    this.scheduledRepeatPeriod = null;
    this.scheduledRepeat = 0;
    return this;
  }

  /**
   * @param ttl In milliseconds
   */
  setTTL(ttl: number): ProducibleMessage {
    this.ttl = ProducibleMessage.validateTTL(ttl);
    return this;
  }

  /**
   * @param timeout In milliseconds
   */
  setConsumeTimeout(timeout: number): ProducibleMessage {
    this.consumeTimeout = ProducibleMessage.validateConsumeTimeout(timeout);
    return this;
  }

  setRetryThreshold(threshold: number): ProducibleMessage {
    this.retryThreshold = ProducibleMessage.validateRetryThreshold(threshold);
    return this;
  }

  /**
   * @param delay In millis
   */
  setRetryDelay(delay: number): ProducibleMessage {
    this.retryDelay = ProducibleMessage.validateRetryDelay(delay);
    return this;
  }

  setBody(body: unknown): ProducibleMessage {
    this.body = body;
    return this;
  }

  setPriority(priority: EMessagePriority): ProducibleMessage {
    this.priority = priority;
    return this;
  }

  hasPriority(): boolean {
    return this.priority !== null;
  }

  disablePriority(): ProducibleMessage {
    this.priority = null;
    return this;
  }

  setFanOut(fanOutName: string): ProducibleMessage {
    this.exchange = new ExchangeFanOut(fanOutName);
    return this;
  }

  setTopic(topicParams: string | TTopicParams): ProducibleMessage {
    this.exchange = new ExchangeTopic(topicParams);
    return this;
  }

  setQueue(queueParams: string | IQueueParams): ProducibleMessage {
    this.exchange = new ExchangeDirect(queueParams);
    return this;
  }

  getQueue(): IQueueParams | string | null {
    if (this.exchange && this.exchange instanceof ExchangeDirect) {
      return this.exchange.getBindingParams();
    }
    return null;
  }

  getTopic(): TTopicParams | string | null {
    if (this.exchange && this.exchange instanceof ExchangeTopic) {
      return this.exchange.getBindingParams();
    }
    return null;
  }

  getFanOut(): string | null {
    if (this.exchange && this.exchange instanceof ExchangeFanOut) {
      return this.exchange.getBindingParams();
    }
    return null;
  }

  setExchange(exchange: TExchange): ProducibleMessage {
    this.exchange = exchange;
    return this;
  }

  getExchange(): TExchange | null {
    return this.exchange;
  }

  getScheduledRepeatPeriod(): number | null {
    return this.scheduledRepeatPeriod;
  }

  getScheduledCRON(): string | null {
    return this.scheduledCron;
  }

  getScheduledRepeat(): number {
    return this.scheduledRepeat;
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

  getPriority(): EMessagePriority | null {
    return this.priority;
  }

  getBody(): unknown {
    return this.body;
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
      ProducibleMessage.defaultConsumeOptions.ttl =
        ProducibleMessage.validateTTL(ttl);

    if (retryDelay !== null)
      ProducibleMessage.defaultConsumeOptions.retryDelay =
        ProducibleMessage.validateRetryDelay(retryDelay);

    if (retryThreshold !== null)
      ProducibleMessage.defaultConsumeOptions.retryThreshold =
        ProducibleMessage.validateRetryThreshold(retryThreshold);

    if (consumeTimeout !== null)
      ProducibleMessage.defaultConsumeOptions.consumeTimeout =
        ProducibleMessage.validateConsumeTimeout(consumeTimeout);
  }
}
