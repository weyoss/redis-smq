/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import cronParser from 'cron-parser';
import { _getExchangeDirectTransferable } from '../exchange/exchange-direct/_/_get-exchange-direct-transferable.js';
import { _getExchangeFanOutTransferable } from '../exchange/exchange-fanout/_/_get-exchange-fanout-transferable.js';
import { _getExchangeTopicTransferable } from '../exchange/exchange-topic/_/_get-exchange-topic-transferable.js';
import {
  EExchangeType,
  ITopicParams,
  TExchangeTransferable,
} from '../exchange/index.js';
import { IQueueParams } from '../queue-manager/index.js';
import { MessagePropertyError } from '../errors/index.js';
import { EMessagePriority, TMessageConsumeOptions } from './types/index.js';

/**
 * The ProducibleMessage class is a core component of the Redis Simple Message Queue (RedisSMQ) library, designed to
 * encapsulate the properties and behaviors of a message that can be produced and consumed within the messaging system.
 * This class provides methods to set and retrieve various message attributes, such as TTL, retry policies, scheduling
 * options, and more.
 */
export class ProducibleMessage {
  /**
   * Holds the default consume options for all instances of the ProducibleMessage class. It includes the following properties:
   * - ttl: The default Time-To-Live (TTL) value in milliseconds. A value of 0 indicates that the message does not expire.
   * - retryThreshold: The default retry threshold value, which specifies the maximum number of times a failed message can be retried before it is considered permanently failed.
   * - retryDelay: The default retry delay value in milliseconds, which specifies the time interval to wait before attempting to retry a failed message.
   * - consumeTimeout: The default consumption timeout value in milliseconds, which specifies the maximum amount of time allowed for a consumer to process the message before it is considered timed out.
   */
  protected static defaultConsumeOptions: TMessageConsumeOptions = {
    ttl: 0,
    retryThreshold: 3,
    retryDelay: 60000,
    consumeTimeout: 0,
  };

  // Stores the timestamp when the message was created. It is automatically set when a new instance of the ProducibleMessage class is instantiated.
  protected readonly createdAt: number;

  // Stores the Time-To-Live (TTL) value for the message. The TTL determines how long the message should remain in the queue before it expires. A value of 0 indicates that the message does not expire.
  protected ttl = 0;

  // Stores the retry threshold value for the message. The retry threshold specifies the maximum number of times a failed message can be retried before it is considered permanently failed.
  protected retryThreshold = 3;

  // Stores the retry delay value for the message. The retry delay specifies the time interval to wait before attempting to retry a failed message.
  protected retryDelay = 60000;

  // Stores the consumption timeout value for the message. The consumption timeout specifies the maximum amount of time allowed for a consumer to process the message before it is considered timed out.
  protected consumeTimeout = 0;

  // Stores the message body. The message body can be any valid JSON value, such as a string, number, object, array, or null.
  protected body: unknown = null;

  // Stores the priority of the message. The priority determines the order in which messages are processed within the queue.
  protected priority: EMessagePriority | null = null;

  // Stores the scheduled cron expression for the message.
  protected scheduledCron: string | null = null;

  // Stores the scheduled delay value for the message. The scheduled delay value specifies the time interval to wait before the message is scheduled to be retried.
  protected scheduledDelay: number | null = null;

  // Stores the scheduled repeat period for the message. The scheduled repeat period specifies the interval at which the message should be retried after being failed.
  protected scheduledRepeatPeriod: number | null = null;

  // Stores the number of times the message has been retried. It is incremented every time the message is retried.
  protected scheduledRepeat = 0;

  // Stores the exchange information for the message. The exchange information includes the type of exchange, the exchange parameters, and the exchange tag.
  protected exchange: TExchangeTransferable | null = null;

  /**
   * Constructs a new instance of the ProducibleMessage class.
   *
   * The constructor initializes the createdAt timestamp with the current time,
   * and sets default values for the consume timeout, retry delay, TTL, and retry threshold.
   * These default values are defined in the static property `defaultConsumeOptions`.
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
   * Sets default consume options for all messages.
   *
   * This function allows developers to set default values for various consume options,
   * such as Time-To-Live (TTL), retry threshold, retry delay, and consumption timeout.
   * These default values can be overridden when producing a message.
   *
   * @param consumeOptions - An object containing the consume options to be set as defaults.
   *                          The object can include the following properties:
   *                          - ttl: The default TTL value in milliseconds.
   *                          - retryThreshold: The default retry threshold value.
   *                          - retryDelay: The default retry delay value in milliseconds.
   *                          - consumeTimeout: The default consumption timeout value in milliseconds.
   *
   * @returns {void} This function does not return any value.
   *
   * @example
   * ```typescript
   * // default consume options
   * const producibleMessage = new ProducibleMessage();
   * producibleMessage.getTTL(); // 0
   * producibleMessage.getRetryThreshold(); // 3
   * producibleMessage.getRetryDelay(); // 60000
   * producibleMessage.getConsumeTimeout(); // 0
   *
   * // overriding default consume options for all messages
   * ProducibleMessage.setDefaultConsumeOptions({
   *   ttl: 60000,
   *   retryThreshold: 3,
   *   retryDelay: 60000,
   *   consumeTimeout: 120000
   * })
   *
   * // checking updated default consume options
   * const msg = new ProducibleMessage();
   * msg.getTTL(); // 60000
   * msg.getRetryThreshold(); // 3
   * msg.getRetryDelay(); // 60000
   * msg.getConsumeTimeout(); // 120000
   *
   * // overriding retry threshold for the current message
   * msg.setRetryThreshold(5);
   * msg.getRetryThreshold(); // 5
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
   * Validates and returns the retry delay for a message.
   *
   * This function checks if the provided delay is a valid number and is not negative.
   * If the delay is not valid, it throws a `MessageMessagePropertyError`.
   *
   * @param {number} delay - The retry delay value in milliseconds.
   * @returns {number} - The validated retry delay value.
   * @throws {MessagePropertyError} - If the provided delay is not a valid number or is negative.
   */
  protected static validateRetryDelay(delay: number): number {
    const value = Number(delay);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    return value;
  }

  /**
   * Validates and returns the Time-To-Live (TTL) value for a message.
   *
   * This function checks if the provided TTL value is a valid number and is not negative.
   * If the value is not valid, it throws a `MessageMessagePropertyError`.
   *
   * @param {unknown} ttl - The TTL value to be validated.
   * @returns {number} - The validated TTL value.
   * @throws {MessagePropertyError} - If the provided TTL value is not a valid number or is negative.
   */
  protected static validateTTL(ttl: unknown): number {
    const value = Number(ttl);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    return value;
  }

  /**
   * Validates and returns the consume timeout value for a message.
   *
   * This function checks if the provided timeout value is a valid number and is not negative.
   * If the value is not valid, it throws a `MessageMessagePropertyError`.
   *
   * @param {unknown} timeout - The timeout value to be validated.
   * @returns {number} - The validated consume timeout value.
   * @throws {MessagePropertyError} - If the provided timeout value is not a valid number or is negative.
   */
  protected static validateConsumeTimeout(timeout: unknown): number {
    const value = Number(timeout);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    return value;
  }

  /**
   * Validates and returns the retry threshold of a message.
   *
   * This function checks if the provided threshold is a valid number and if it is greater than or equal to zero.
   * If the threshold is not a valid number or if it is less than zero, an error is thrown.
   *
   * @param {unknown} threshold - The retry threshold value to be validated.
   * @returns {number} - The validated retry threshold value.
   * @throws {MessagePropertyError} - If the provided threshold is not a valid number or if it is less than zero.
   */
  protected static validateRetryThreshold(threshold: unknown): number {
    const value = Number(threshold);
    if (isNaN(value) || value < 0) {
      throw new MessagePropertyError();
    }
    return value;
  }

  /**
   * Retrieves the timestamp when the message was created.
   *
   * The createdAt timestamp is automatically set when a new message is created.
   *
   * @returns The createdAt timestamp as a Unix timestamp (milliseconds since epoch).
   *          This value can be used for tracking the age of the message or for
   *          other purposes related to message management.
   */
  getCreatedAt(): number {
    return this.createdAt;
  }

  /**
   * Sets the repeat period for a scheduled message.
   *
   * This method allows you to specify a delay to wait for between each message delivery, enabling the
   * creation of recurring jobs without the need for complex CRON expressions.
   *
   * The method should be used in conjunction with setScheduledRepeat() to determine
   * how many times a message should be redelivered.
   *
   * @param {number} period - The repeat period value in milliseconds.
   *                          A positive integer representing the time interval between redeliveries.
   *                          If the provided value is not a positive integer, a MessageMessagePropertyError is thrown.
   *
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @throws {MessagePropertyError} - If the provided period value is not a positive integer.
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
   * Sets a delay for scheduling the current message's delivery.
   *
   * This function allows you to specify a delay in milliseconds before the message is
   * actually sent to the queue. The delay ensures that the message is not delivered
   * immediately, allowing for the system to perform any necessary operations or checks.
   *
   * @param {number} delay - The delay value in milliseconds. A positive integer representing the
   *                         time to wait before sending the message.
   *
   * @throws {MessagePropertyError} - If the provided delay value is not a positive integer,
   *                                      this error is thrown.
   *
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setscheduledelay
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
   * Retrieve the scheduled delay time for a message, which indicates how long
   * the message should be delayed before it is delivered to a queue.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setscheduleddelay
   */
  getScheduledDelay(): number | null {
    return this.scheduledDelay;
  }

  /**
   * Sets a CRON expression for scheduling the message's delivery.
   *
   * This function allows you to specify a CRON expression to define the schedule for
   * when the message should be delivered. The CRON expression is a string that follows
   * a specific format, which defines the frequency and timing of the delivery.
   *
   * This function may be used in conjunction with setScheduledRepeat() and setScheduledRepeatPeriod(). For example,
   * to publish a message every day at 10AM and from then publish the message with a delay of 10 minutes for 3 times:
   *
   * ```typescript
   * const producibleMessage = new ProducibleMessage();
   * producibleMessage.setScheduledCRON('0 0 10 * * *').setScheduledRepeat(3).setScheduledRepeatPeriod(36000);
   * ```
   *
   * @param {string} cron - The CRON expression to define the schedule for the message's delivery.
   *                        The expression should follow the CRON format standards.
   *
   * @throws {Error} - Throws an error if the provided CRON expression is invalid.
   *
   * @returns {ProducibleMessage} - Returns the instance of the ProducibleMessage class, allowing method chaining.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setscheduledcron
   */
  setScheduledCRON(cron: string): ProducibleMessage {
    // it throws an exception for an invalid value
    cronParser.parseExpression(cron);
    this.scheduledCron = cron;
    return this;
  }

  /**
   * Sets the number of times a message is scheduled to repeat after its initial delivery.
   *
   * This function is used to define how many times a message should be redelivered after its initial processing.
   * The repeat count is used in conjunction with the scheduled repeat period to determine the total number of times
   * the message will be delivered.
   *
   * @param {number} repeat - The number of times the message is scheduled to repeat.
   *                          Must be a non-negative integer.
   *                          If the provided value is not a number or is negative, a `MessageMessagePropertyError` is thrown.
   *
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @throws {MessagePropertyError} - If the provided repeat value is not a non-negative integer.
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
   * Resets the scheduled parameters of the message.
   *
   * This function clears any previously set scheduled parameters for the message,
   * such as the CRON expression, delay, repeat period, and repeat count.
   * After calling this method, the message will no longer be scheduled for recurring deliveries.
   *
   * @returns {ProducibleMessage} The updated `ProducibleMessage` instance with the reset scheduled parameters.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setscheduledcron
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setscheduleddelay
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setscheduledrepeatperiod
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setscheduledrepeat
   */
  resetScheduledParams(): ProducibleMessage {
    this.scheduledCron = null;
    this.scheduledDelay = null;
    this.scheduledRepeatPeriod = null;
    this.scheduledRepeat = 0;
    return this;
  }

  /**
   * Sets the Time-To-Live (TTL) value for the current message.
   *
   * The TTL determines how long the message should remain in the queue before
   * it expires. This is useful for managing message lifetimes and preventing
   * the processing of outdated messages.
   *
   * @param {number} ttl - The TTL value in milliseconds. A value of 0 indicates that the
   *                       message does not expire.
   *
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setttl
   */
  setTTL(ttl: number): ProducibleMessage {
    this.ttl = ProducibleMessage.validateTTL(ttl);
    return this;
  }

  /**
   * Sets the consumption timeout for the current message.
   *
   * The consumption timeout specifies the maximum amount of time allowed for a consumer
   * to process the message before it is considered timed out. This feature is useful in
   * managing system resources and preventing messages from being stuck indefinitely.
   *
   * The default consumption timeout is 0, which means there is no timeout set.
   *
   * @param {number} timeout - The consumption timeout value in milliseconds.
   *                            A value of 0 indicates no timeout is set.
   *
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setconsumetimeout
   */
  setConsumeTimeout(timeout: number): ProducibleMessage {
    this.consumeTimeout = ProducibleMessage.validateConsumeTimeout(timeout);
    return this;
  }

  /**
   * Sets the retry threshold for the current message.
   *
   * Set the number of times a failed message can be retried before it is
   * considered permanently failed and moved to a dead-letter queue (DLQ) or discarded
   * according to the message queue configuration.
   *
   * The default retry threshold is 3.
   *
   * @param {number} threshold - The retry threshold value. A positive integer representing the
   *                             maximum number of retry attempts for the message. A value of 0 indicates no retry attempts.
   *
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setretrythreshold
   */
  setRetryThreshold(threshold: number): ProducibleMessage {
    this.retryThreshold = ProducibleMessage.validateRetryThreshold(threshold);
    return this;
  }

  /**
   * Sets the retry delay for failed messages.
   *
   * This function allows you to specify how long the system should wait before attempting to retry the
   * processing of a failed message.
   *
   * This feature is crucial in ensuring that message processing is robust,
   * especially in scenarios where temporary failures might occur, such as
   * database unavailability or network issues.
   *
   * By utilizing a retry delay, you can reduce the risk of overwhelming your
   * system with retries for messages that are likely to fail again immediately,
   * thereby enhancing the reliability of your message processing.
   *
   * This method should be used in conjunction with setRetryThreshold().
   *
   * The default retry delay is 60000 milliseconds (1 minute).
   *
   * @param {number} delay - The retry delay value in milliseconds. A value of 0 indicates no delay
   *                         between retry attempts.
   *
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setretrydelay
   */
  setRetryDelay(delay: number): ProducibleMessage {
    this.retryDelay = ProducibleMessage.validateRetryDelay(delay);
    return this;
  }

  /**
   * Sets the payload of the message to be sent.
   *
   * The payload contains the actual data that the consumer will process.
   *
   * @param {unknown} body - The payload to be sent with the message. This can be of any type,
   *                         but it will be converted to a string before being sent.
   *
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
   */
  setBody(body: unknown): ProducibleMessage {
    this.body = body;
    return this;
  }

  /**
   * Sets the priority level of a message for processing.
   *
   * This feature allows developers to manage the order in which messages are
   * processed based on their priority, enabling more important tasks to be handled before others.
   *
   * Message priority should be set only when producing a message to a priority queue.
   * Otherwise, message priority does not take effect.
   *
   * @param {EMessagePriority} priority - The priority level for the message.
   *                                    The available priority levels are defined in the EMessagePriority enum.
   *
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/queues.md
   */
  setPriority(priority: EMessagePriority): ProducibleMessage {
    this.priority = priority;
    return this;
  }

  /**
   * Checks if a priority level has been set for the current message.
   *
   * This method returns a boolean value indicating whether a priority level has been
   * specified for the message. If the priority level is not null, it means a priority
   * level has been set, and the method returns true. Otherwise, it returns false.
   *
   * @returns {boolean} - Returns true if a priority level has been set for the message,
   *                      false otherwise.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setpriority
   */
  hasPriority(): boolean {
    return this.priority !== null;
  }

  /**
   * Disables the priority setting for the current message.
   *
   * This method resets the priority level of the message to null, effectively disabling
   * the priority feature for this particular message. After calling this method, the message
   * will be processed based on its default settings, without considering its priority.
   *
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setpriority
   */
  disablePriority(): ProducibleMessage {
    this.priority = null;
    return this;
  }

  /**
   * Sets a fan-out pattern for message publication, enabling a publish-subscribe model
   * where messages can be sent to multiple queues simultaneously.
   *
   * The fan-out pattern allows messages to be sent to multiple queues
   * simultaneously, enabling effective distribution of messages to various
   * subscribers.
   *
   * This feature is particularly useful in scenarios where you
   * want multiple services to react to the same event or message without
   * needing to duplicate the message for each queue.
   *
   * @param {string} fanOutName - The name of the fan-out pattern.
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/exchanges-and-delivery-models.md

   */
  setFanOut(fanOutName: string): ProducibleMessage {
    const exchange = _getExchangeFanOutTransferable(fanOutName);
    if (exchange instanceof Error) throw exchange;
    this.exchange = exchange;
    return this;
  }

  /**
   * Sets a topic for message publication, enabling a publish-subscribe model
   * where messages can be sent to specific channels (topics) and consumed
   * by subscribers interested in those topics.
   *
   * A topic can be thought of as a categorization or a label that groups
   * related queues together.
   *
   * This feature is useful for organizing and filtering messages based on
   * their content or purpose.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/exchanges-and-delivery-models.md
   * @param {string | ITopicParams} topicParams
   */
  setTopic(topicParams: string | ITopicParams): ProducibleMessage {
    const exchange = _getExchangeTopicTransferable(topicParams);
    if (exchange instanceof Error) throw exchange;
    this.exchange = exchange;
    return this;
  }

  /**
   * Sets the queue parameters for the message, enabling a direct message publication model
   * where messages can be sent to a specific queue and consumed
   * by consumers interested in those messages.
   *
   * @param {string | IQueueParams} queueParams - The queue parameters can be provided as a string (queue name) or as an object (queue parameters).
   *                                                  If a string is provided, it should be the name of the queue.
   *                                                  If an object is provided, it should contain the queue parameters as defined in the RedisSMQ documentation.
   * @returns {ProducibleMessage} - The updated `ProducibleMessage` instance, allowing method chaining.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/exchanges-and-delivery-models.md
   */
  setQueue(queueParams: string | IQueueParams): ProducibleMessage {
    const exchange = _getExchangeDirectTransferable(queueParams);
    if (exchange instanceof Error) throw exchange;
    this.exchange = exchange;
    return this;
  }

  /**
   * Retrieves the queue parameters associated with the current message.
   *
   * This method returns the queue parameters that were set for the message using the
   * setQueue method. The queue parameters determine how the message will be routed within
   * the messaging system.
   *
   * @returns {ITopicParams | null} The queue parameters associated with the message.
   *          Returns null if no queue parameters have been set.
   *
   * @see For more information on setting the queue parameters:
   *      https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setqueue
   */
  getQueue(): IQueueParams | null {
    if (this.exchange && this.exchange.type === EExchangeType.DIRECT) {
      return this.exchange.params;
    }
    return null;
  }

  /**
   * Retrieves the topic parameters associated with the current message.
   *
   * This method returns the topic parameters that were set for the message using the
   * setTopic method. The topic parameters determine how the message will be routed within
   * the messaging system.
   *
   * @returns {ITopicParams | null} The topic parameters associated with the message.
   *          Returns null if no topic parameters have been set.
   *
   * @see For more information on setting the topic parameters:
   *      https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#settopic
   */
  getTopic(): ITopicParams | null {
    if (this.exchange && this.exchange.type === EExchangeType.TOPIC) {
      return this.exchange.params;
    }
    return null;
  }

  /**
   * Retrieves the fan-out pattern associated with the current message.
   *
   * This method returns the fan-out pattern that was set for the message using the
   * setFanOut method. The fan-out pattern determines how the message will be
   * distributed to multiple queues simultaneously.
   *
   * @returns {string | null} The fan-out pattern name as a string if one has been set,
   *                          or null if no fan-out pattern has been defined for this message.
   *
   * @see For more information on setting the fan-out pattern:
   *      https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setfanout
   */
  getFanOut(): string | null {
    if (this.exchange && this.exchange.type === EExchangeType.FANOUT) {
      return this.exchange.params;
    }
    return null;
  }

  /**
   * Retrieves the exchange (fan-out, topic, or queue name) associated with the current message.
   *
   * This method returns the exchange that was set for the message using one of the
   * setQueue, setTopic, or setFanOut methods. The exchange determines how the message
   * will be routed within the messaging system.
   *
   * @returns {TExchangeTransferable | null} The exchange associated with the message.
   *          Returns null if no exchange has been set.
   *          The returned object contains information about the exchange type and its parameters.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setqueue
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#settopic
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setfanout
   */
  getExchange(): TExchangeTransferable | null {
    if (this.exchange) {
      return this.exchange;
    }
    return null;
  }

  /**
   * Retrieves the scheduled repeat period of a message.
   *
   * The repeat period is used in conjunction with the scheduled repeat count
   * to determine how often and how many times a message should be redelivered.
   *
   * @returns {number | null} The scheduled repeat period in milliseconds if set,
   *                          or null if no repeat period has been defined for this message.
   *
   * @see For more information on setting the scheduled repeat period:
   *      https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setscheduledrepeatperiod
   */
  getScheduledRepeatPeriod(): number | null {
    return this.scheduledRepeatPeriod;
  }

  /**
   * Retrieves the CRON expression associated with a scheduled message.
   *
   * This method returns the CRON expression that was set for the message using
   * the setScheduledCRON method. The CRON expression defines the schedule
   * for recurring message deliveries.
   *
   * @returns {string | null} The CRON expression as a string if one has been set,
   *                          or null if no CRON schedule has been defined for this message.
   *
   * @see For more information on setting the CRON schedule:
   *      https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setscheduledcron
   */
  getScheduledCRON(): string | null {
    return this.scheduledCron;
  }

  /**
   * Retrieves the number of times a message is scheduled to repeat.
   *
   * This method returns the value set by the setScheduledRepeat method, which determines
   * how many times a message should be redelivered after its initial delivery.
   *
   * @returns {number} The number of times the message is scheduled to repeat.
   *                   A value of 0 indicates the message is not scheduled for repetition.
   *
   * @see For more information on setting the scheduled repeat:
   *      https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setscheduledrepeat
   */
  getScheduledRepeat(): number {
    return this.scheduledRepeat;
  }

  /**
   * Retrieves the Time-To-Live (TTL) value set for the message.
   *
   * The TTL determines how long the message should remain in the queue before
   * it expires. This is useful for managing message lifetimes and preventing
   * the processing of outdated messages.
   *
   * @returns The TTL value in milliseconds. A value of 0 indicates that the
   *          message does not expire.
   *
   * @see For more information on setting the TTL:
   *      https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setttl
   */
  getTTL(): number {
    return this.ttl;
  }

  /**
   * Retrieves the retry threshold of a message.
   *
   * The retry threshold specifies the maximum number of times a failed message
   * will be retried before it is considered permanently failed and potentially
   * moved to a dead-letter queue.
   *
   * @returns The retry threshold value. A positive integer representing the
   *          maximum number of retry attempts for the message.
   *
   * @see For more information on setting the retry threshold:
   *      https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setretrythreshold
   */
  getRetryThreshold(): number {
    return this.retryThreshold;
  }

  /**
   * Retrieves the retry delay set for the message.
   *
   * The retry delay specifies the time interval to wait before attempting to reprocess
   * a failed message. This delay helps in managing system resources and allows for
   * temporary issues to be resolved before retrying.
   *
   * @returns The retry delay value in milliseconds. A value of 0 indicates no delay
   *          between retry attempts.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setretrydelay
   */
  getRetryDelay(): number {
    return this.retryDelay;
  }

  /**
   * Retrieves the consumption timeout value set for the message.
   *
   * The consumption timeout specifies the maximum amount of time allowed for a consumer
   * to process the message before it is considered timed out.
   *
   * @returns {number} The consumption timeout value in milliseconds.
   *                   A value of 0 indicates no timeout is set.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setconsumetimeout
   */
  getConsumeTimeout(): number {
    return this.consumeTimeout;
  }

  /**
   * Retrieves the priority level set for the current message.
   *
   * This method returns the priority level that was set for the message using the
   * setPriority method. The priority level determines the order in which messages
   * are processed when using a priority queue.
   *
   * @returns {EMessagePriority | null} The priority level of the message as defined
   *          in the EMessagePriority enum, or null if no priority has been set.
   *
   * @see For more information on setting the priority:
   *      https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setpriority
   */
  getPriority(): EMessagePriority | null {
    return this.priority;
  }

  /**
   * Retrieves the payload of a message.
   *
   * See https://github.com/weyoss/redis-smq/blob/master/packages/redis-smq/docs/api/classes/ProducibleMessage.md#setbody
   */
  getBody(): unknown {
    return this.body;
  }
}
