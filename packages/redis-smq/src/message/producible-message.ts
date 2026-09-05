/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CronExpressionParser } from 'cron-parser';
import { _parseExchangeParams } from '../exchange/_/_parse-exchange-params.js';
import {
  EExchangeType,
  IExchangeParams,
  IExchangeParsedParams,
} from '../exchange/index.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { IQueueParams } from '../queue-manager/index.js';
import { EMessagePriority, TMessageConsumeOptions } from './types/index.js';
import {
  ExchangeRequiredError,
  InvalidCronExpressionError,
  MessagePropertyInvalidValueError,
} from '../errors/index.js';

/**
 * Configures a message for production to queues or exchanges.
 *
 * Provides methods to set message properties: TTL, retry policies,
 * scheduling, priority, and routing (direct queue or exchange-based).
 *
 * @example
 * const message = new ProducibleMessage()
 *   .setBody({ userId: 123 })
 *   .setQueue('orders')
 *   .setTTL(60000)
 *   .setPriority(EMessagePriority.HIGH);
 */
export class ProducibleMessage {
  /**
   * Default consume options for all instances.
   */
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
  protected exchange: IExchangeParsedParams | null = null;
  protected exchangeRoutingKey: string | null = null;
  protected queue: IQueueParams | null = null;

  constructor() {
    this.createdAt = Date.now();
    const { consumeTimeout, retryDelay, ttl, retryThreshold } =
      ProducibleMessage.defaultConsumeOptions;
    this.setConsumeTimeout(consumeTimeout);
    this.setRetryDelay(retryDelay);
    this.setTTL(ttl);
    this.setRetryThreshold(retryThreshold);
  }

  protected static validateRetryDelay(delay: number): number {
    const value = Number(delay);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyInvalidValueError({
        metadata: { property: 'retryDelay', value },
      });
    }
    return value;
  }

  protected static validateTTL(ttl: unknown): number {
    const value = Number(ttl);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyInvalidValueError({
        metadata: { property: 'ttl', value },
      });
    }
    return value;
  }

  protected static validateConsumeTimeout(timeout: unknown): number {
    const value = Number(timeout);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyInvalidValueError({
        metadata: { property: 'consumeTimeout', value },
      });
    }
    return value;
  }

  protected static validateRetryThreshold(threshold: unknown): number {
    const value = Number(threshold);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyInvalidValueError({
        metadata: { property: 'retryThreshold', value },
      });
    }
    return value;
  }

  protected setExchange(
    exchange: string | IExchangeParams,
    type: EExchangeType,
  ): ProducibleMessage {
    const exchangeParams = _parseExchangeParams(exchange, type);
    if (exchangeParams instanceof Error) throw exchangeParams;
    this.exchange = exchangeParams;
    this.queue = null;
    this.exchangeRoutingKey = null;
    return this;
  }

  /**
   * Sets default consume options for all future instances.
   *
   * @param consumeOptions - Partial options to override defaults
   *
   * @example
   * ProducibleMessage.setDefaultConsumeOptions({
   *   ttl: 60000,
   *   retryThreshold: 5,
   *   retryDelay: 30000
   * });
   */
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

  /**
   * Gets the timestamp when the message was created.
   *
   * @example
   * const msg = new ProducibleMessage();
   * console.log(msg.getCreatedAt());
   */
  getCreatedAt(): number {
    return this.createdAt;
  }

  /**
   * Sets the repeat period for scheduled message delivery.
   *
   * @param period - Repeat period in milliseconds
   *
   * @example
   * msg.setScheduledRepeatPeriod(60000); // Every minute
   */
  setScheduledRepeatPeriod(period: number): ProducibleMessage {
    const value = Number(period);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyInvalidValueError({
        metadata: { property: 'scheduledRepeatPeriod', value },
      });
    }
    this.scheduledRepeatPeriod = value;
    return this;
  }

  /**
   * Sets a delay before the message's initial delivery.
   *
   * @param delay - Delay in milliseconds
   *
   * @example
   * msg.setScheduledDelay(30000); // Deliver after 30 seconds
   */
  setScheduledDelay(delay: number): ProducibleMessage {
    const value = Number(delay);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyInvalidValueError({
        metadata: { property: 'scheduledDelay', value },
      });
    }
    this.scheduledDelay = value;
    return this;
  }

  /**
   * Gets the scheduled delay for message delivery.
   *
   * @example
   * const delay = msg.getScheduledDelay();
   */
  getScheduledDelay(): number | null {
    return this.scheduledDelay;
  }

  /**
   * Sets a CRON expression for scheduled message delivery.
   * Accepts both 5‑field (standard Unix) and 6‑field (with seconds) formats.
   * 5‑field expressions are automatically converted to 6‑field by prefixing
   * `0` for the seconds component.
   *
   * @param cron - CRON expression (e.g., '0 30 9 * * 1-5' or '30 9 * * 1-5')
   *
   * @example
   * msg.setScheduledCRON('0 30 9 * * 1-5'); // 6‑field (seconds, minutes, hours, ...)
   * msg.setScheduledCRON('30 9 * * 1-5');   // 5‑field (minutes, hours, ...)
   */
  setScheduledCRON(cron: string): ProducibleMessage {
    const expr = cron.trim();
    const fields = expr.split(/\s+/);
    const fieldCount = fields.length;
    if (fieldCount !== 5 && fieldCount !== 6) {
      throw new InvalidCronExpressionError({ metadata: { expression: expr } });
    }
    try {
      CronExpressionParser.parse(expr);
    } catch {
      throw new InvalidCronExpressionError({ metadata: { expression: expr } });
    }
    this.scheduledCron = expr;
    return this;
  }

  /**
   * Sets the number of times a message should repeat after initial delivery.
   *
   * @param repeat - Number of repetitions
   *
   * @example
   * msg.setScheduledRepeat(3); // Repeat 3 times
   */
  setScheduledRepeat(repeat: number): ProducibleMessage {
    const value = Number(repeat);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyInvalidValueError({
        metadata: { property: 'scheduledRepeat', value },
      });
    }
    this.scheduledRepeat = value;
    return this;
  }

  /**
   * Resets all scheduled parameters to defaults.
   *
   * @example
   * msg.resetScheduledParams();
   */
  resetScheduledParams(): ProducibleMessage {
    this.scheduledCron = null;
    this.scheduledDelay = null;
    this.scheduledRepeatPeriod = null;
    this.scheduledRepeat = 0;
    return this;
  }

  /**
   * Sets the Time-To-Live (TTL) for the message.
   *
   * @param ttl - TTL in milliseconds (0 = no expiration)
   *
   * @example
   * msg.setTTL(300000); // Expire after 5 minutes
   */
  setTTL(ttl: number): ProducibleMessage {
    this.ttl = ProducibleMessage.validateTTL(ttl);
    return this;
  }

  /**
   * Sets the consumption timeout for the message.
   *
   * @param timeout - Timeout in milliseconds (0 = no timeout)
   *
   * @example
   * msg.setConsumeTimeout(30000); // 30 second timeout
   */
  setConsumeTimeout(timeout: number): ProducibleMessage {
    this.consumeTimeout = ProducibleMessage.validateConsumeTimeout(timeout);
    return this;
  }

  /**
   * Sets the maximum number of retry attempts for failed messages.
   *
   * @param threshold - Maximum retry attempts (0 = no retries)
   *
   * @example
   * msg.setRetryThreshold(5);
   */
  setRetryThreshold(threshold: number): ProducibleMessage {
    this.retryThreshold = ProducibleMessage.validateRetryThreshold(threshold);
    return this;
  }

  /**
   * Sets the delay between retry attempts.
   *
   * @param delay - Delay in milliseconds
   *
   * @example
   * msg.setRetryDelay(30000); // Wait 30 seconds between retries
   */
  setRetryDelay(delay: number): ProducibleMessage {
    this.retryDelay = ProducibleMessage.validateRetryDelay(delay);
    return this;
  }

  /**
   * Sets the message payload.
   *
   * @param body - Any JSON-serializable value
   *
   * @example
   * msg.setBody({ userId: 123, action: 'process' });
   */
  setBody(body: unknown): ProducibleMessage {
    this.body = body;
    return this;
  }

  /**
   * Sets the priority level for the message.
   *
   * @param priority - Priority from EMessagePriority enum
   *
   * @example
   * msg.setPriority(EMessagePriority.HIGH);
   */
  setPriority(priority: EMessagePriority): ProducibleMessage {
    this.priority = priority;
    return this;
  }

  /**
   * Checks if a priority level has been set.
   *
   * @example
   * if (msg.hasPriority()) {
   *   console.log(msg.getPriority());
   * }
   */
  hasPriority(): boolean {
    return this.priority !== null;
  }

  /**
   * Removes the priority setting from the message.
   *
   * @example
   * msg.disablePriority();
   */
  disablePriority(): ProducibleMessage {
    this.priority = null;
    return this;
  }

  /**
   * Sets a fanout exchange for message routing.
   *
   * @param exchange - Exchange name or parameters
   *
   * @example
   * msg.setFanoutExchange('notifications');
   */
  setFanoutExchange(exchange: string | IExchangeParams): ProducibleMessage {
    return this.setExchange(exchange, EExchangeType.FANOUT);
  }

  /**
   * Sets a topic exchange for message routing.
   *
   * @param exchange - Exchange name or parameters
   *
   * @example
   * msg.setTopicExchange('events').setExchangeRoutingKey('user.created');
   */
  setTopicExchange(exchange: string | IExchangeParams): ProducibleMessage {
    return this.setExchange(exchange, EExchangeType.TOPIC);
  }

  /**
   * Sets a direct exchange for message routing.
   *
   * @param exchange - Exchange name or parameters
   *
   * @example
   * msg.setDirectExchange('tasks').setExchangeRoutingKey('high');
   */
  setDirectExchange(exchange: string | IExchangeParams): ProducibleMessage {
    return this.setExchange(exchange, EExchangeType.DIRECT);
  }

  /**
   * Sets the routing key for exchange-based message delivery.
   *
   * @param routingKey - Routing key
   *
   * @example
   * msg.setTopicExchange('events').setExchangeRoutingKey('user.login');
   */
  setExchangeRoutingKey(routingKey: string): ProducibleMessage {
    if (!this.exchange) throw new ExchangeRequiredError();
    this.exchangeRoutingKey = routingKey;
    return this;
  }

  /**
   * Gets the current exchange routing key.
   *
   * @example
   * const key = msg.getExchangeRoutingKey();
   */
  getExchangeRoutingKey(): string | null {
    return this.exchangeRoutingKey;
  }

  /**
   * Sets the target queue for direct message delivery.
   *
   * @param queue - Queue name or parameters
   *
   * @example
   * msg.setQueue('orders');
   */
  setQueue(queue: string | IQueueParams): ProducibleMessage {
    const queueParams = _parseQueueParams(queue);
    if (queueParams instanceof Error) throw queueParams;
    this.queue = queueParams;
    this.exchange = null;
    this.exchangeRoutingKey = null;
    return this;
  }

  /**
   * Gets the current target queue configuration.
   *
   * @example
   * const queue = msg.getQueue();
   * console.log(queue?.name);
   */
  getQueue(): IQueueParams | null {
    return this.queue;
  }

  /**
   * Gets the current exchange configuration.
   *
   * @example
   * const exchange = msg.getExchange();
   * console.log(exchange?.type);
   */
  getExchange(): IExchangeParsedParams | null {
    return this.exchange;
  }

  /**
   * Gets the scheduled repeat period.
   *
   * @example
   * const period = msg.getScheduledRepeatPeriod();
   */
  getScheduledRepeatPeriod(): number | null {
    return this.scheduledRepeatPeriod;
  }

  /**
   * Gets the CRON expression for scheduled delivery.
   *
   * @example
   * const cron = msg.getScheduledCRON();
   */
  getScheduledCRON(): string | null {
    return this.scheduledCron;
  }

  /**
   * Gets the number of times the message is scheduled to repeat.
   *
   * @example
   * const repeat = msg.getScheduledRepeat();
   */
  getScheduledRepeat(): number {
    return this.scheduledRepeat;
  }

  /**
   * Gets the Time-To-Live (TTL) value.
   *
   * @example
   * const ttl = msg.getTTL();
   */
  getTTL(): number {
    return this.ttl;
  }

  /**
   * Gets the retry threshold.
   *
   * @example
   * const threshold = msg.getRetryThreshold();
   */
  getRetryThreshold(): number {
    return this.retryThreshold;
  }

  /**
   * Gets the retry delay.
   *
   * @example
   * const delay = msg.getRetryDelay();
   */
  getRetryDelay(): number {
    return this.retryDelay;
  }

  /**
   * Gets the consumption timeout.
   *
   * @example
   * const timeout = msg.getConsumeTimeout();
   */
  getConsumeTimeout(): number {
    return this.consumeTimeout;
  }

  /**
   * Gets the priority level of the message.
   *
   * @example
   * const priority = msg.getPriority();
   */
  getPriority(): EMessagePriority | null {
    return this.priority;
  }

  /**
   * Gets the message payload.
   *
   * @example
   * const body = msg.getBody();
   */
  getBody(): unknown {
    return this.body;
  }
}
