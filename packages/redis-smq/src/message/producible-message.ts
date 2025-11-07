/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { CronExpressionParser } from 'cron-parser';
import { MessageError, MessagePropertyError } from '../errors/index.js';
import { _parseExchangeParams } from '../exchange/_/_parse-exchange-params.js';
import {
  EExchangeType,
  IExchangeParams,
  IExchangeParsedParams,
} from '../exchange/index.js';
import { _parseQueueParams } from '../queue-manager/_/_parse-queue-params.js';
import { IQueueParams } from '../queue-manager/index.js';
import { EMessagePriority, TMessageConsumeOptions } from './types/index.js';

/**
 * The ProducibleMessage class is a core component of the Redis Simple Message Queue (RedisSMQ) library, designed to
 * encapsulate the properties and behaviors of a message that can be produced and consumed within the messaging system.
 * This class provides methods to set and retrieve various message attributes, such as TTL, retry policies, scheduling
 * options, and more.
 *
 * @example
 * ```typescript
 * const message = new ProducibleMessage()
 *   .setBody({ userId: 123, action: 'process' })
 *   .setTTL(60000)
 *   .setRetryThreshold(5)
 *   .setPriority(EMessagePriority.HIGH);
 * ```
 */
export class ProducibleMessage {
  /**
   * Default consume options for all instances of the ProducibleMessage class.
   *
   * @static
   * @readonly
   * @type {TMessageConsumeOptions}
   * @property {number} ttl - The default Time-To-Live (TTL) value in milliseconds. A value of 0 indicates that the message does not expire.
   * @property {number} retryThreshold - The default retry threshold value, which specifies the maximum number of times a failed message can be retried before it is considered permanently failed.
   * @property {number} retryDelay - The default retry delay value in milliseconds, which specifies the time interval to wait before attempting to retry a failed message.
   * @property {number} consumeTimeout - The default consumption timeout value in milliseconds, which specifies the maximum amount of time allowed for a consumer to process the message before it is considered timed out.
   */
  protected static defaultConsumeOptions: TMessageConsumeOptions = {
    ttl: 0,
    retryThreshold: 3,
    retryDelay: 60000,
    consumeTimeout: 0,
  };

  /**
   * Timestamp when the message was created. Automatically set during instantiation.
   * @protected
   * @readonly
   * @type {number}
   */
  protected readonly createdAt: number;

  /**
   * Time-To-Live (TTL) value for the message in milliseconds.
   * @protected
   * @type {number}
   * @default 0
   */
  protected ttl = 0;

  /**
   * Maximum number of retry attempts for failed messages.
   * @protected
   * @type {number}
   * @default 3
   */
  protected retryThreshold = 3;

  /**
   * Delay between retry attempts in milliseconds.
   * @protected
   * @type {number}
   * @default 60000
   */
  protected retryDelay = 60000;

  /**
   * Maximum time allowed for message consumption in milliseconds.
   * @protected
   * @type {number}
   * @default 0
   */
  protected consumeTimeout = 0;

  /**
   * Message payload data.
   * @protected
   * @type {unknown}
   * @default null
   */
  protected body: unknown = null;

  /**
   * Message priority level.
   * @protected
   * @type {EMessagePriority | null}
   * @default null
   */
  protected priority: EMessagePriority | null = null;

  /**
   * CRON expression for scheduled message delivery.
   * @protected
   * @type {string | null}
   * @default null
   */
  protected scheduledCron: string | null = null;

  /**
   * Delay before initial scheduled delivery in milliseconds.
   * @protected
   * @type {number | null}
   * @default null
   */
  protected scheduledDelay: number | null = null;

  /**
   * Period between repeated scheduled deliveries in milliseconds.
   * @protected
   * @type {number | null}
   * @default null
   */
  protected scheduledRepeatPeriod: number | null = null;

  /**
   * Number of times the message should repeat after initial delivery.
   * @protected
   * @type {number}
   * @default 0
   */
  protected scheduledRepeat = 0;

  /**
   * Exchange configuration for message routing.
   * @protected
   * @type {IExchangeParsedParams | null}
   * @default null
   */
  protected exchange: IExchangeParsedParams | null = null;

  /**
   * Routing key for exchange-based message delivery.
   * @protected
   * @type {string | null}
   * @default null
   */
  protected exchangeRoutingKey: string | null = null;

  /**
   * Target queue for direct message delivery.
   * @protected
   * @type {IQueueParams | null}
   * @default null
   */
  protected queue: IQueueParams | null = null;

  /**
   * Constructs a new ProducibleMessage instance with default consume options.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage();
   * console.log(message.getTTL()); // 0
   * console.log(message.getRetryThreshold()); // 3
   * ```
   */
  constructor() {
    this.createdAt = Date.now();
    const { consumeTimeout, retryDelay, ttl, retryThreshold } =
      ProducibleMessage.defaultConsumeOptions;
    this.setConsumeTimeout(consumeTimeout);
    this.setRetryDelay(retryDelay);
    this.setTTL(ttl);
    this.setRetryThreshold(retryThreshold);
  }

  /**
   * Sets default consume options for all future ProducibleMessage instances.
   *
   * @static
   * @param {Partial<TMessageConsumeOptions>} consumeOptions - Partial consume options to override defaults
   * @param {number} [consumeOptions.ttl] - Default TTL value in milliseconds
   * @param {number} [consumeOptions.retryThreshold] - Default retry threshold value
   * @param {number} [consumeOptions.retryDelay] - Default retry delay value in milliseconds
   * @param {number} [consumeOptions.consumeTimeout] - Default consumption timeout value in milliseconds
   * @throws {MessagePropertyError} When any provided value is invalid
   *
   * @example
   * ```typescript
   * // Set new defaults
   * ProducibleMessage.setDefaultConsumeOptions({
   *   ttl: 60000,
   *   retryThreshold: 5,
   *   retryDelay: 30000,
   *   consumeTimeout: 120000
   * });
   *
   * // New instances will use these defaults
   * const message = new ProducibleMessage();
   * console.log(message.getTTL()); // 60000
   * console.log(message.getRetryThreshold()); // 5
   * ```
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
   * Validates a retry delay value.
   *
   * @static
   * @protected
   * @param {number} delay - The retry delay value in milliseconds
   * @returns {number} The validated retry delay value
   * @throws {MessagePropertyError} When the delay is not a valid non-negative number
   */
  protected static validateRetryDelay(delay: number): number {
    const value = Number(delay);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    return value;
  }

  /**
   * Validates a Time-To-Live (TTL) value.
   *
   * @static
   * @protected
   * @param {unknown} ttl - The TTL value to validate
   * @returns {number} The validated TTL value
   * @throws {MessagePropertyError} When the TTL is not a valid non-negative number
   */
  protected static validateTTL(ttl: unknown): number {
    const value = Number(ttl);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    return value;
  }

  /**
   * Validates a consume timeout value.
   *
   * @static
   * @protected
   * @param {unknown} timeout - The timeout value to validate
   * @returns {number} The validated consume timeout value
   * @throws {MessagePropertyError} When the timeout is not a valid non-negative number
   */
  protected static validateConsumeTimeout(timeout: unknown): number {
    const value = Number(timeout);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    return value;
  }

  /**
   * Validates a retry threshold value.
   *
   * @static
   * @protected
   * @param {unknown} threshold - The retry threshold value to validate
   * @returns {number} The validated retry threshold value
   * @throws {MessagePropertyError} When the threshold is not a valid non-negative number
   */
  protected static validateRetryThreshold(threshold: unknown): number {
    const value = Number(threshold);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    return value;
  }

  /**
   * Gets the timestamp when the message was created.
   *
   * @returns {number} Unix timestamp in milliseconds when the message was created
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage();
   * const createdTime = message.getCreatedAt();
   * console.log(new Date(createdTime)); // Current date/time
   * ```
   */
  getCreatedAt(): number {
    return this.createdAt;
  }

  /**
   * Sets the repeat period for scheduled message delivery.
   *
   * Used with {@link setScheduledRepeat} to create recurring messages with a fixed interval.
   *
   * @param {number} period - The repeat period in milliseconds (must be non-negative)
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {MessagePropertyError} When the period is not a valid non-negative number
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setScheduledRepeatPeriod(60000) // Repeat every minute
   *   .setScheduledRepeat(5); // Repeat 5 times
   * ```
   *
   * @see {@link setScheduledRepeat}
   */
  setScheduledRepeatPeriod(period: number): ProducibleMessage {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(period);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    this.scheduledRepeatPeriod = value;
    return this;
  }

  /**
   * Sets a delay before the message's initial delivery.
   *
   * @param {number} delay - The delay in milliseconds (must be non-negative)
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {MessagePropertyError} When the delay is not a valid non-negative number
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setScheduledDelay(30000) // Deliver after 30 seconds
   *   .setBody({ task: 'delayed-task' });
   * ```
   *
   * @see {@link getScheduledDelay}
   */
  setScheduledDelay(delay: number): ProducibleMessage {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(delay);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    this.scheduledDelay = value;
    return this;
  }

  /**
   * Gets the scheduled delay for message delivery.
   *
   * @returns {number | null} The scheduled delay in milliseconds, or null if not set
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setScheduledDelay(5000);
   * console.log(message.getScheduledDelay()); // 5000
   * ```
   *
   * @see {@link setScheduledDelay}
   */
  getScheduledDelay(): number | null {
    return this.scheduledDelay;
  }

  /**
   * Sets a CRON expression for scheduled message delivery.
   *
   * Can be combined with {@link setScheduledRepeat} and {@link setScheduledRepeatPeriod} for complex scheduling.
   *
   * @param {string} cron - Valid CRON expression (e.g., '0 0 10 * * *' for daily at 10 AM)
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {Error} When the CRON expression is invalid
   *
   * @example
   * ```typescript
   * // Daily at 10 AM, then repeat 3 times with 10-minute intervals
   * const message = new ProducibleMessage()
   *   .setScheduledCRON('0 0 10 * * *')
   *   .setScheduledRepeat(3)
   *   .setScheduledRepeatPeriod(600000); // 10 minutes
   * ```
   *
   * @see {@link setScheduledRepeat}
   * @see {@link setScheduledRepeatPeriod}
   */
  setScheduledCRON(cron: string): ProducibleMessage {
    // it throws an exception for an invalid value
    CronExpressionParser.parse(cron);
    this.scheduledCron = cron;
    return this;
  }

  /**
   * Sets the number of times a message should repeat after initial delivery.
   *
   * @param {number} repeat - Number of repetitions (must be non-negative)
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {MessagePropertyError} When the repeat value is not a valid non-negative number
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setScheduledRepeat(3) // Repeat 3 times after initial delivery
   *   .setScheduledRepeatPeriod(60000); // Every minute
   * ```
   *
   * @see {@link setScheduledRepeatPeriod}
   */
  setScheduledRepeat(repeat: number): ProducibleMessage {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(repeat);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    this.scheduledRepeat = value;
    return this;
  }

  /**
   * Resets all scheduled parameters to their default values.
   *
   * Clears CRON expression, delay, repeat period, and repeat count.
   *
   * @returns {ProducibleMessage} This instance for method chaining
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setScheduledCRON('0 0 10 * * *')
   *   .setScheduledRepeat(5)
   *   .resetScheduledParams(); // All scheduling cleared
   *
   * console.log(message.getScheduledCRON()); // null
   * console.log(message.getScheduledRepeat()); // 0
   * ```
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
   * Messages with expired TTL will be automatically removed from the queue.
   *
   * @param {number} ttl - TTL in milliseconds (0 means no expiration)
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {MessagePropertyError} When the TTL is not a valid non-negative number
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setTTL(300000) // Expire after 5 minutes
   *   .setBody({ urgent: true });
   * ```
   *
   * @see {@link getTTL}
   */
  setTTL(ttl: number): ProducibleMessage {
    this.ttl = ProducibleMessage.validateTTL(ttl);
    return this;
  }

  /**
   * Sets the consumption timeout for the message.
   *
   * If a consumer takes longer than this timeout to process the message,
   * the message will be considered failed and may be retried.
   *
   * @param {number} timeout - Timeout in milliseconds (0 means no timeout)
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {MessagePropertyError} When the timeout is not a valid non-negative number
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setConsumeTimeout(30000) // 30 second timeout
   *   .setBody({ complexTask: true });
   * ```
   *
   * @see {@link getConsumeTimeout}
   */
  setConsumeTimeout(timeout: number): ProducibleMessage {
    this.consumeTimeout = ProducibleMessage.validateConsumeTimeout(timeout);
    return this;
  }

  /**
   * Sets the maximum number of retry attempts for failed messages.
   *
   * After exceeding this threshold, messages may be moved to a dead-letter queue.
   *
   * @param {number} threshold - Maximum retry attempts (0 means no retries)
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {MessagePropertyError} When the threshold is not a valid non-negative number
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setRetryThreshold(5) // Retry up to 5 times
   *   .setRetryDelay(10000); // Wait 10 seconds between retries
   * ```
   *
   * @see {@link setRetryDelay}
   * @see {@link getRetryThreshold}
   */
  setRetryThreshold(threshold: number): ProducibleMessage {
    this.retryThreshold = ProducibleMessage.validateRetryThreshold(threshold);
    return this;
  }

  /**
   * Sets the delay between retry attempts for failed messages.
   *
   * Helps prevent overwhelming the system with immediate retries and allows
   * temporary issues to resolve.
   *
   * @param {number} delay - Delay in milliseconds (0 means no delay)
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {MessagePropertyError} When the delay is not a valid non-negative number
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setRetryDelay(30000) // Wait 30 seconds between retries
   *   .setRetryThreshold(3); // Retry up to 3 times
   * ```
   *
   * @see {@link setRetryThreshold}
   * @see {@link getRetryDelay}
   */
  setRetryDelay(delay: number): ProducibleMessage {
    this.retryDelay = ProducibleMessage.validateRetryDelay(delay);
    return this;
  }

  /**
   * Sets the message payload.
   *
   * The payload will be JSON-serialized when the message is sent.
   *
   * @param {unknown} body - The message payload (any JSON-serializable value)
   * @returns {ProducibleMessage} This instance for method chaining
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setBody({
   *     userId: 123,
   *     action: 'send-email',
   *     data: { email: 'user@example.com' }
   *   });
   * ```
   *
   * @see {@link getBody}
   */
  setBody(body: unknown): ProducibleMessage {
    this.body = body;
    return this;
  }

  /**
   * Sets the priority level for the message.
   *
   * Only effective when producing to a priority queue. Higher priority messages
   * are processed before lower priority ones.
   *
   * @param {EMessagePriority} priority - The priority level from EMessagePriority enum
   * @returns {ProducibleMessage} This instance for method chaining
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setPriority(EMessagePriority.HIGH)
   *   .setBody({ urgent: true });
   * ```
   *
   * @see {@link getPriority}
   * @see {@link hasPriority}
   * @see {@link disablePriority}
   */
  setPriority(priority: EMessagePriority): ProducibleMessage {
    this.priority = priority;
    return this;
  }

  /**
   * Checks if a priority level has been set for the message.
   *
   * @returns {boolean} True if priority is set, false otherwise
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage();
   * console.log(message.hasPriority()); // false
   *
   * message.setPriority(EMessagePriority.HIGH);
   * console.log(message.hasPriority()); // true
   * ```
   *
   * @see {@link setPriority}
   */
  hasPriority(): boolean {
    return this.priority !== null;
  }

  /**
   * Removes the priority setting from the message.
   *
   * @returns {ProducibleMessage} This instance for method chaining
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setPriority(EMessagePriority.HIGH)
   *   .disablePriority();
   *
   * console.log(message.hasPriority()); // false
   * ```
   *
   * @see {@link setPriority}
   * @see {@link hasPriority}
   */
  disablePriority(): ProducibleMessage {
    this.priority = null;
    return this;
  }

  /**
   * Sets a fanout exchange for message routing.
   *
   * Fanout exchanges deliver messages to all bound queues, ignoring routing keys.
   *
   * @param {string | IExchangeParams} exchange - Exchange name or parameters
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {Error} When exchange parameters are invalid
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setFanoutExchange('notifications')
   *   .setBody({ type: 'broadcast' });
   * ```
   *
   * @see {@link setTopicExchange}
   * @see {@link setDirectExchange}
   */
  setFanoutExchange(exchange: string | IExchangeParams): ProducibleMessage {
    return this.setExchange(exchange, EExchangeType.FANOUT);
  }

  /**
   * Sets a topic exchange for message routing.
   *
   * Topic exchanges route messages based on routing key patterns.
   *
   * @param {string | IExchangeParams} exchange - Exchange name or parameters
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {Error} When exchange parameters are invalid
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setTopicExchange('events')
   *   .setExchangeRoutingKey('user.created')
   *   .setBody({ userId: 123 });
   * ```
   *
   * @see {@link setExchangeRoutingKey}
   * @see {@link setFanoutExchange}
   * @see {@link setDirectExchange}
   */
  setTopicExchange(exchange: string | IExchangeParams): ProducibleMessage {
    return this.setExchange(exchange, EExchangeType.TOPIC);
  }

  /**
   * Sets a direct exchange for message routing.
   *
   * Direct exchanges route messages to queues with matching routing keys.
   *
   * @param {string | IExchangeParams} exchange - Exchange name or parameters
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {Error} When exchange parameters are invalid
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setDirectExchange('tasks')
   *   .setExchangeRoutingKey('high-priority')
   *   .setBody({ task: 'urgent-task' });
   * ```
   *
   * @see {@link setExchangeRoutingKey}
   * @see {@link setFanoutExchange}
   * @see {@link setTopicExchange}
   */
  setDirectExchange(exchange: string | IExchangeParams): ProducibleMessage {
    return this.setExchange(exchange, EExchangeType.DIRECT);
  }

  /**
   * Sets the routing key for exchange-based message delivery.
   *
   * @param {string} routingKey - The routing key for message routing
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {MessageError} When no exchange has been set
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setTopicExchange('events')
   *   .setExchangeRoutingKey('user.login.success');
   * ```
   *
   * @see {@link getExchangeRoutingKey}
   * @see {@link setTopicExchange}
   * @see {@link setDirectExchange}
   */
  setExchangeRoutingKey(routingKey: string): ProducibleMessage {
    if (!this.exchange)
      throw new MessageError(
        'An exchange is required. Use setDirectExchange/setTopicExchange/setFanoutExchange to set an exchange.',
      );
    this.exchangeRoutingKey = routingKey;
    return this;
  }

  /**
   * Gets the current exchange routing key.
   *
   * @returns {string | null} The routing key, or null if not set
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setTopicExchange('events')
   *   .setExchangeRoutingKey('user.created');
   *
   * console.log(message.getExchangeRoutingKey()); // 'user.created'
   * ```
   *
   * @see {@link setExchangeRoutingKey}
   */
  getExchangeRoutingKey(): string | null {
    return this.exchangeRoutingKey;
  }

  /**
   * Sets the target queue for direct message delivery.
   *
   * Setting a queue clears any previously set exchange configuration.
   *
   * @param {string | IQueueParams} queue - Queue name or parameters
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {Error} When queue parameters are invalid
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   *   .setQueue('user-tasks')
   *   .setBody({ userId: 123, task: 'process' });
   * ```
   *
   * @see {@link getQueue}
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
   * @returns {IQueueParams | null} Queue parameters, or null if not set
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setQueue('my-queue');
   * const queue = message.getQueue();
   * console.log(queue?.name); // 'my-queue'
   * ```
   *
   * @see {@link setQueue}
   */
  getQueue(): IQueueParams | null {
    return this.queue;
  }

  /**
   * Gets the current exchange configuration.
   *
   * @returns {IExchangeParsedParams | null} Exchange parameters, or null if not set
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setTopicExchange('events');
   * const exchange = message.getExchange();
   * console.log(exchange?.name); // 'events'
   * console.log(exchange?.type); // EExchangeType.TOPIC
   * ```
   *
   * @see {@link setTopicExchange}
   * @see {@link setDirectExchange}
   * @see {@link setFanoutExchange}
   */
  getExchange(): IExchangeParsedParams | null {
    return this.exchange;
  }

  /**
   * Gets the scheduled repeat period for the message.
   *
   * @returns {number | null} Repeat period in milliseconds, or null if not set
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setScheduledRepeatPeriod(60000);
   * console.log(message.getScheduledRepeatPeriod()); // 60000
   * ```
   *
   * @see {@link setScheduledRepeatPeriod}
   */
  getScheduledRepeatPeriod(): number | null {
    return this.scheduledRepeatPeriod;
  }

  /**
   * Gets the CRON expression for scheduled message delivery.
   *
   * @returns {string | null} CRON expression, or null if not set
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setScheduledCRON('0 0 10 * * *');
   * console.log(message.getScheduledCRON()); // '0 0 10 * * *'
   * ```
   *
   * @see {@link setScheduledCRON}
   */
  getScheduledCRON(): string | null {
    return this.scheduledCron;
  }

  /**
   * Gets the number of times the message is scheduled to repeat.
   *
   * @returns {number} Number of repetitions (0 means no repetition)
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setScheduledRepeat(3);
   * console.log(message.getScheduledRepeat()); // 3
   * ```
   *
   * @see {@link setScheduledRepeat}
   */
  getScheduledRepeat(): number {
    return this.scheduledRepeat;
  }

  /**
   * Gets the Time-To-Live (TTL) value for the message.
   *
   * @returns {number} TTL in milliseconds (0 means no expiration)
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setTTL(300000);
   * console.log(message.getTTL()); // 300000
   * ```
   *
   * @see {@link setTTL}
   */
  getTTL(): number {
    return this.ttl;
  }

  /**
   * Gets the retry threshold for the message.
   *
   * @returns {number} Maximum number of retry attempts
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setRetryThreshold(5);
   * console.log(message.getRetryThreshold()); // 5
   * ```
   *
   * @see {@link setRetryThreshold}
   */
  getRetryThreshold(): number {
    return this.retryThreshold;
  }

  /**
   * Gets the retry delay for the message.
   *
   * @returns {number} Delay between retry attempts in milliseconds
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setRetryDelay(30000);
   * console.log(message.getRetryDelay()); // 30000
   * ```
   *
   * @see {@link setRetryDelay}
   */
  getRetryDelay(): number {
    return this.retryDelay;
  }

  /**
   * Gets the consumption timeout for the message.
   *
   * @returns {number} Timeout in milliseconds (0 means no timeout)
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setConsumeTimeout(120000);
   * console.log(message.getConsumeTimeout()); // 120000
   * ```
   *
   * @see {@link setConsumeTimeout}
   */
  getConsumeTimeout(): number {
    return this.consumeTimeout;
  }

  /**
   * Gets the priority level of the message.
   *
   * @returns {EMessagePriority | null} Priority level, or null if not set
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setPriority(EMessagePriority.HIGH);
   * console.log(message.getPriority()); // EMessagePriority.HIGH
   * ```
   *
   * @see {@link setPriority}
   */
  getPriority(): EMessagePriority | null {
    return this.priority;
  }

  /**
   * Gets the message payload.
   *
   * @returns {unknown} The message payload
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setBody({ userId: 123 });
   * console.log(message.getBody()); // { userId: 123 }
   * ```
   *
   * @see {@link setBody}
   */
  getBody(): unknown {
    return this.body;
  }

  /**
   * Sets an exchange with the specified type.
   *
   * @protected
   * @param {string | IExchangeParams} exchange - Exchange name or parameters
   * @param {EExchangeType} type - Exchange type
   * @returns {ProducibleMessage} This instance for method chaining
   * @throws {Error} When exchange parameters are invalid
   */
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
}
