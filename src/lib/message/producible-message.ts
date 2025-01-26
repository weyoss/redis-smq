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
import { _getExchangeFanOutTransferable } from '../exchange/exchange-fan-out/_/_get-exchange-fanout-transferable.js';
import { _getExchangeTopicTransferable } from '../exchange/exchange-topic/_/_get-exchange-topic-transferable.js';
import {
  EExchangeType,
  ITopicParams,
  TExchangeTransferable,
} from '../exchange/index.js';
import { IQueueParams } from '../queue/index.js';
import { MessageMessagePropertyError } from './errors/index.js';
import { EMessagePriority, TMessageConsumeOptions } from './types/index.js';

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

  protected exchange: TExchangeTransferable | null = null;

  constructor() {
    this.createdAt = Date.now();
    const { consumeTimeout, retryDelay, ttl, retryThreshold } =
      ProducibleMessage.defaultConsumeOptions;
    this.setConsumeTimeout(consumeTimeout);
    this.setRetryDelay(retryDelay);
    this.setTTL(ttl);
    this.setRetryThreshold(retryThreshold);
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

  protected static validateRetryDelay(delay: number): number {
    const value = Number(delay);
    if (isNaN(value) || value < 0) {
      throw new MessageMessagePropertyError();
    }
    return value;
  }

  protected static validateTTL(ttl: unknown): number {
    const value = Number(ttl);
    if (isNaN(value) || value < 0) {
      throw new MessageMessagePropertyError();
    }
    return value;
  }

  protected static validateConsumeTimeout(timeout: unknown): number {
    const value = Number(timeout);
    if (isNaN(value) || value < 0) {
      throw new MessageMessagePropertyError();
    }
    return value;
  }

  protected static validateRetryThreshold(threshold: unknown): number {
    const value = Number(threshold);
    if (isNaN(value) || value < 0) {
      throw new MessageMessagePropertyError();
    }
    return value;
  }

  /**
   * Retrieve the timestamp, in milliseconds, of when a message was created.
   *
   * When a message is created RedisSMQ automatically assigns a timestamp to mark its creation time.
   */
  getCreatedAt(): number {
    return this.createdAt;
  }

  /**
   * Specify a delay to wait for between each message delivery, enabling the
   * creation of recurring jobs without the need for complex CRON expressions.
   *
   * Use setScheduledRepeat() to set the number of times the message should be delivered.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledrepeat
   * @param {number} period - The interval, in milliseconds, between message publications.
   */
  setScheduledRepeatPeriod(period: number): ProducibleMessage {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(period);
    if (isNaN(value) || value < 0) {
      throw new MessageMessagePropertyError();
    }
    this.scheduledRepeatPeriod = value;
    return this;
  }

  /**
   * Schedule a message to be delivered after a specified delay,
   * rather than being processed immediately upon sending.
   *
   * This feature is particularly useful for situations where you want to defer
   * the execution of a job or message until a certain amount of time has passed.
   *
   * @param {number} delay - Delay duration. The delay is set in milliseconds.
   */
  setScheduledDelay(delay: number): ProducibleMessage {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(delay);
    if (isNaN(value) || value < 0) {
      throw new MessageMessagePropertyError();
    }
    this.scheduledDelay = value;
    return this;
  }

  /**
   * Retrieve the scheduled delay time for a message, which indicates how long
   * the message should be delayed before it is delivered to a queue.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduleddelay
   */
  getScheduledDelay(): number | null {
    return this.scheduledDelay;
  }

  /**
   * Schedule jobs to be executed at specific intervals using the CRON syntax.
   * This feature allows users to set up recurring jobs in a flexible manner
   * based on time-based schedules.
   *
   * Please note that setScheduledCRON() may be used together with
   * setScheduledRepeat() and setScheduledRepeatPeriod().
   * When used together, the message will be published respecting the CRON
   * expression, and then it will be repeated N times.
   * For example, to publish a message every day at 10AM and from then publish
   * the message with a delay of 10 min for 3 times:
   * producibleMessage.setScheduledCRON('0 0 10 * * *').setScheduledRepeat(3).setScheduledRepeatPeriod(36000)
   *
   * @param {string} cron - A valid CRON expression.
   */
  setScheduledCRON(cron: string): ProducibleMessage {
    // it throws an exception for an invalid value
    cronParser.parseExpression(cron);
    this.scheduledCron = cron;
    return this;
  }

  /**
   * Schedule a message to be delivered repeatedly for a specified number of
   * times.
   *
   * To set an interval between each delivery use setScheduledRepeatPeriod().
   *
   * @param {number} repeat - The number of times the message should be delivered to a queue.
   */
  setScheduledRepeat(repeat: number): ProducibleMessage {
    // JavaScript users do not have type checking
    // So just make sure that we have an integer value
    const value = Number(repeat);
    if (isNaN(value) || value < 0) {
      throw new MessageMessagePropertyError();
    }
    this.scheduledRepeat = value;
    return this;
  }

  /**
   *  Reset any scheduling settings for a message.
   *
   *  This can be useful in scenarios where you want to change or update the
   *  scheduling settings.
   */
  resetScheduledParams(): ProducibleMessage {
    this.scheduledCron = null;
    this.scheduledDelay = null;
    this.scheduledRepeatPeriod = null;
    this.scheduledRepeat = 0;
    return this;
  }

  /**
   * Set a time-to-live (TTL) for messages in the queue.
   *
   * This means that you can define a specific duration after which a message
   * will expire and be removed from the queue if it has not been processed.
   * This feature is helpful for managing resource consumption, ensuring that
   * old or unprocessed messages do not linger indefinitely.
   *
   * @param {number} ttl - Should be >=0. In milliseconds.
   */
  setTTL(ttl: number): ProducibleMessage {
    this.ttl = ProducibleMessage.validateTTL(ttl);
    return this;
  }

  /**
   * Set a timeout for message consumption.
   *
   * This feature is important for ensuring that message processing does not
   * hang indefinitely and allows you to define how long a consumer can take to
   * process a message before it is considered timed out.
   *
   * @param {number} timeout - In milliseconds.
   */
  setConsumeTimeout(timeout: number): ProducibleMessage {
    this.consumeTimeout = ProducibleMessage.validateConsumeTimeout(timeout);
    return this;
  }

  /**
   * Set the number of times a failed message can be retried before it is
   * considered failed and moved to a dead letter queue (DLQ) or handled in
   * some other way according to the configuration.
   *
   * When a message fails processing, RedisSMQ can automatically retry the
   * message. The setRetryThreshold function controls how many times this retry
   * mechanism is attempted.
   *
   * If all retries fail, the message can be moved to a DLQ for further
   * analysis or manual intervention.
   *
   * @param {number} threshold -  Retry threshold
   */
  setRetryThreshold(threshold: number): ProducibleMessage {
    this.retryThreshold = ProducibleMessage.validateRetryThreshold(threshold);
    return this;
  }

  /**
   * Set how long the system should wait before attempting to retry the
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
   * Use this method together with setRetryThreshold().
   *
   * Default is 60000 millis (1 minute).
   *
   * @param {number} delay - The delay before retrying the processing of a message that has previously failed. In millis.
   */
  setRetryDelay(delay: number): ProducibleMessage {
    this.retryDelay = ProducibleMessage.validateRetryDelay(delay);
    return this;
  }

  /**
   * Set the payload of a message that will be sent through the message queue.
   *
   * The "body" contains the actual data that the consumer will process, and
   * it can be any valid format, such as a JSON object or string, that
   * JSON.serialize() accepts.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
   * @param {any} body
   */
  setBody(body: unknown): ProducibleMessage {
    this.body = body;
    return this;
  }

  /**
   * Set the priority level of a message in a priority queue.
   * This feature allows developers to manage the order in which messages are
   * processed based on their priority, enabling more important tasks to be handled before others.
   *
   * Message priority should be set only when producing a message to a priority queue.
   * Otherwise, message priority does not take effect.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/queues.md
   * @param {EMessagePriority} priority
   */
  setPriority(priority: EMessagePriority): ProducibleMessage {
    this.priority = priority;
    return this;
  }

  /**
   * Check whether a particular message has priority settings enabled.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setpriority
   */
  hasPriority(): boolean {
    return this.priority !== null;
  }

  /**
   * Turn off priority settings for a message.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setpriority
   */
  disablePriority(): ProducibleMessage {
    this.priority = null;
    return this;
  }

  /**
   * Set a fan-out message pattern for message publication.
   *
   * The fan-out pattern allows messages to be sent to multiple queues
   * simultaneously, enabling effective distribution of messages to various
   * subscribers.
   *
   * This feature is particularly useful in scenarios where you
   * want multiple services to react to the same event or message without
   * needing to duplicate the message for each queue.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/exchanges-and-delivery-models.md
   * @param {string} fanOutName - The fan-out pattern.
   */
  setFanOut(fanOutName: string): ProducibleMessage {
    const exchange = _getExchangeFanOutTransferable(fanOutName);
    if (exchange instanceof Error) throw exchange;
    this.exchange = exchange;
    return this;
  }

  /**
   * Set a topic for message publication, enabling a publish-subscribe model
   * where messages can be sent to specific channels (topics) and consumed
   * by subscribers interested in those topics.
   *
   * A topic can be thought of as a categorization or a label that groups
   * related queues together.
   *
   * This feature is useful for organizing and filtering messages based on
   * their content or purpose.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/exchanges-and-delivery-models.md
   * @param {string | ITopicParams} topicParams
   */
  setTopic(topicParams: string | ITopicParams): ProducibleMessage {
    const exchange = _getExchangeTopicTransferable(topicParams);
    if (exchange instanceof Error) throw exchange;
    this.exchange = exchange;
    return this;
  }

  /**
   * Specify to which queue the message should be sent when it is published.
   *
   * This feature allows developers to manage different types of tasks or jobs
   * by routing them to designated queues, facilitating better organization
   * and scalability of message processing in applications.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/exchanges-and-delivery-models.md
   * @param {string | IQueueParams} queueParams
   */
  setQueue(queueParams: string | IQueueParams): ProducibleMessage {
    const exchange = _getExchangeDirectTransferable(queueParams);
    if (exchange instanceof Error) throw exchange;
    this.exchange = exchange;
    return this;
  }

  /**
   * Retrieve the specific queue associated with a message instance.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setqueue
   */
  getQueue(): IQueueParams | null {
    if (this.exchange && this.exchange.type === EExchangeType.DIRECT) {
      return this.exchange.params;
    }
    return null;
  }

  /**
   * Retrieve the topic name of the message.
   *
   * When a message is sent to a topic, it is delivered to all queues of that topic.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#settopic
   */
  getTopic(): ITopicParams | null {
    if (this.exchange && this.exchange.type === EExchangeType.TOPIC) {
      return this.exchange.params;
    }
    return null;
  }

  /**
   * Retrieve the fan-out pattern associated with a specific message.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setfanout
   */
  getFanOut(): string | null {
    if (this.exchange && this.exchange.type === EExchangeType.FANOUT) {
      return this.exchange.params;
    }
    return null;
  }

  /**
   * Retrieve the exchange (fan-out, topic, or queue name) associated with a
   * specific message.
   *
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setqueue
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#settopic
   * @see https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setfanout
   */
  getExchange(): TExchangeTransferable | null {
    if (this.exchange) {
      return this.exchange;
    }
    return null;
  }

  /**
   * Retrieve the scheduled repeat period of a message.
   *
   * See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledrepeatperiod
   */
  getScheduledRepeatPeriod(): number | null {
    return this.scheduledRepeatPeriod;
  }

  /**
   * Retrieve the CRON expression associated with a scheduled message.
   *
   * See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledcron
   */
  getScheduledCRON(): string | null {
    return this.scheduledCron;
  }

  /**
   * Retrieve the scheduled repeat interval of a message that has been
   * previously scheduled for repeat processing.
   *
   * See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setscheduledrepeat
   */
  getScheduledRepeat(): number {
    return this.scheduledRepeat;
  }

  /**
   * Retrieve the TTL of a message.
   *
   * See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setttl
   */
  getTTL(): number {
    return this.ttl;
  }

  /**
   * Retrieve the retry threshold of a message.
   *
   * See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setretrythreshold
   */
  getRetryThreshold(): number {
    return this.retryThreshold;
  }

  /**
   * Retrieve the retry delay of a message.
   *
   * See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setretrydelay
   */
  getRetryDelay(): number {
    return this.retryDelay;
  }

  /**
   * Retrieve consumption timeout of a message.
   *
   * See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setconsumetimeout
   */
  getConsumeTimeout(): number {
    return this.consumeTimeout;
  }

  /**
   * Retrieve the priority level of a message.
   *
   * See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setpriority
   */
  getPriority(): EMessagePriority | null {
    return this.priority;
  }

  /**
   * Retrieve the payload of a message.
   *
   * See https://github.com/weyoss/redis-smq/blob/master/docs/api/classes/ProducibleMessage.md#setbody
   */
  getBody(): unknown {
    return this.body;
  }
}
