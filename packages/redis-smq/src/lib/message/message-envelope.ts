/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import cronParser from 'cron-parser';
import { TExchangeTransferable } from '../exchange/index.js';
import { IQueueParams } from '../queue/index.js';
import {
  MessageDestinationQueueAlreadySetError,
  MessageDestinationQueueRequiredError,
  MessageMessageExchangeRequiredError,
} from './errors/index.js';
import { MessageState } from './message-state.js';
import { ProducibleMessage } from './producible-message.js';
import {
  EMessagePropertyStatus,
  IMessageParams,
  IMessageTransferable,
} from './types/index.js';

export class MessageEnvelope {
  readonly producibleMessage;
  protected messageState: MessageState;
  protected status: EMessagePropertyStatus = EMessagePropertyStatus.UNPUBLISHED;
  protected destinationQueue: IQueueParams | null = null;
  protected consumerGroupId: string | null = null;

  constructor(producibleMessage: ProducibleMessage) {
    this.producibleMessage = producibleMessage;
    this.messageState = new MessageState();
    const scheduledDelay = this.producibleMessage.getScheduledDelay();
    if (scheduledDelay) this.messageState.setNextScheduledDelay(scheduledDelay);
  }

  /**
   * Retrieves the message state associated with the message envelope.
   *
   * @returns {MessageState} - The message state object containing information about the message's attempts,
   *                           next scheduled delay, scheduled cron firing status, and message scheduled repeat count.
   *
   * @remarks
   * The message state object keeps track of various properties related to the message's delivery and processing.
   * It includes the number of attempts made to consume the message, the delay for the next scheduled delivery,
   * the status of the scheduled cron, and the count of repeated message deliveries.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setQueue('my-queue');
   * const envelope = new MessageEnvelope(message);
   * const messageState = envelope.getMessageState();
   * console.log(messageState.getAttempts()); // Output: 0
   * console.log(messageState.getNextScheduledDelay()); // Output: null
   * console.log(messageState.isScheduledCronFired()); // Output: false
   * console.log(messageState.getMessageScheduledRepeatCount()); // Output: 0
   * ```
   */
  getMessageState(): MessageState {
    return this.messageState;
  }

  /**
   * Sets the message state associated with the message envelope.
   *
   * @param m - The message state to be associated with the message envelope.
   *
   * @returns {MessageEnvelope} - The updated message envelope instance with the message state set.
   *
   * @remarks
   * The message state includes information about the number of attempts made to consume the message,
   * the next scheduled delay, whether the scheduled CRON has been fired, and the count of repeated message deliveries.
   *
   * @example
   * ```typescript
   * const message = new MessageEnvelope(new ProducibleMessage('Hello, world!'));
   * const messageState = new MessageState();
   * messageState.incrAttempts(); // Increment attempts by 1
   * messageState.setNextScheduledDelay(60000); // Schedule message to be delivered in 1 minute
   * message.setMessageState(messageState);
   * console.log(message.getMessageState()); // Output: { attempts: 1, nextScheduledDelay: 60000, scheduledCronFired: false, messageScheduledRepeatCount: 0 }
   * ```
   */
  setMessageState(m: MessageState): MessageEnvelope {
    this.messageState = m;
    return this;
  }

  /**
   * Retrieves the unique identifier of the message envelope.
   *
   * @returns {string} - The unique identifier of the message envelope.
   *
   * @remarks
   * The unique identifier is generated when the message envelope is created and is used to identify the message within the system.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setBody('Hello, world!').setQueue('my-queue');
   * const envelope = new MessageEnvelope(message);
   * console.log(envelope.getId()); // Output: 'message-id'
   * ```
   */
  getId(): string {
    return this.messageState.getId();
  }

  /**
   * Checks if the message envelope has expired based on its TTL and creation timestamp.
   *
   * @returns {boolean} - Returns `true` if the message envelope has expired (TTL has passed),
   *                      otherwise `false`.
   *
   * @remarks
   * The TTL (Time To Live) is defined by the `ProducibleMessage` associated with the message envelope.
   * The function calculates the elapsed time since the message's creation timestamp and compares it with the TTL.
   * If the elapsed time is greater than or equal to the TTL, the function returns `true`, indicating that the message envelope has expired.
   * Otherwise, the function returns `false`, indicating that the message envelope has not expired.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setBody('Hello, world!').setQueue('my-queue').setTTL(3600000);
   * const envelope = new MessageEnvelope(message);
   * console.log(message.getSetExpired()); // Output: false (message has not expired yet)
   *
   * // After 2 hours (7200000 milliseconds)
   * console.log(message.getSetExpired()); // Output: true (message has expired)
   * ```
   */
  getSetExpired(): boolean {
    return this.getMessageState().getSetExpired(
      this.producibleMessage.getTTL(),
      this.producibleMessage.getCreatedAt(),
    );
  }

  getStatus(): EMessagePropertyStatus {
    return this.status;
  }

  setDestinationQueue(queue: IQueueParams): MessageEnvelope {
    if (this.destinationQueue !== null) {
      throw new MessageDestinationQueueAlreadySetError();
    }
    this.destinationQueue = queue;
    return this;
  }

  setStatus(s: EMessagePropertyStatus): MessageEnvelope {
    this.status = s;
    return this;
  }

  getDestinationQueue(): IQueueParams {
    if (!this.destinationQueue) {
      throw new MessageDestinationQueueRequiredError();
    }
    return this.destinationQueue;
  }

  /**
   * Checks if the message envelope has a delay set for the next scheduled message delivery.
   *
   * @returns {boolean} - Returns `true` if the message envelope has a delay set, indicating that the next scheduled message delivery
   *                      will be delayed. Returns `false` if the message envelope does not have a delay set, indicating that the next
   *                      scheduled message delivery will occur immediately.
   *
   * @remarks
   * The delay is set using the `setScheduledDelay` method of the `ProducibleMessage` associated with the message envelope.
   * The function checks if the message state has a delay set using the `hasDelay` method.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setQueue('my-queue');
   * message.setScheduledDelay(60000); // Schedule message to be delivered in 1 minute
   * const envelope = new MessageEnvelope(message);
   * console.log(envelope.hasNextDelay()); // Output: true
   * ```
   */
  hasNextDelay(): boolean {
    return this.messageState.hasDelay();
  }

  /**
   * Calculates the timestamp of the next scheduled message delivery based on the message's delay and periodic settings.
   *
   * @returns {number} The timestamp of the next scheduled message delivery in milliseconds since epoch.
   *                   Returns 0 if the message is not schedulable.
   *
   * @remarks
   * The function considers the message's delay, CRON schedule, and repeat settings to determine the next scheduled timestamp.
   * If the message has a delay set, the function returns the current timestamp plus the delay.
   * If the message has a CRON schedule set, the function returns the timestamp of the next CRON schedule.
   * If the message has a repeat count greater than 0, the function returns the timestamp of the next repeat delivery.
   * If the message is not schedulable (neither has a delay nor is periodic), the function returns 0.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage()
   * message.setQueue('my-queue');
   * message.setScheduledDelay(60000); // Schedule message to be delivered in 1 minute
   * const envelope = new MessageEnvelope(message);
   * console.log(envelope.getNextScheduledTimestamp()); // Output: 1642678860000 (timestamp in milliseconds)
   *
   * const message2 = new ProducibleMessage()
   * message2.setQueue('my-queue');
   * message2.setScheduledCRON('* * * * *'); // Schedule message every minute
   * const envelope2 = new MessageEnvelope(message2);
   * console.log(envelope2.getNextScheduledTimestamp()); // Output: 1642678860000 (timestamp in milliseconds)
   *
   * const message3 = new ProducibleMessage();
   * const envelope3 = new MessageEnvelope(message3);
   * console.log(envelope3.getNextScheduledTimestamp()); // Output: 0
   * ```
   */
  getNextScheduledTimestamp(): number {
    if (this.isSchedulable()) {
      const messageState = this.getMessageState();

      // Delay
      const delay = messageState.getSetNextDelay();
      if (delay) {
        return Date.now() + delay;
      }

      // CRON
      const msgScheduledCron = this.producibleMessage.getScheduledCRON();
      const cronTimestamp = msgScheduledCron
        ? cronParser.parseExpression(msgScheduledCron).next().getTime()
        : 0;

      // Repeat
      const msgScheduledRepeat = this.producibleMessage.getScheduledRepeat();
      let repeatTimestamp = 0;
      if (msgScheduledRepeat) {
        const newCount = messageState.getMessageScheduledRepeatCount() + 1;
        if (newCount <= msgScheduledRepeat) {
          const scheduledRepeatPeriod =
            this.producibleMessage.getScheduledRepeatPeriod();
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

  /**
   * Retrieves the exchange associated with the producible message.
   *
   * @throws {MessageMessageExchangeRequiredError} - If the producible message does not have an exchange set.
   *
   * @returns {TExchangeTransferable} - The exchange associated with the producible message.
   *
   * @remarks
   * The exchange is used to route messages to the appropriate queues based on their routing keys.
   * This function retrieves the exchange associated with the producible message and throws an error
   * if no exchange is set.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setBody('Hello, world!').setExchange('my-exchange');
   * const envelope = new MessageEnvelope(message);
   * const exchange = envelope.getExchange();
   * console.log(exchange); // Output: { name: 'my-exchange', type: 'direct' }
   * ```
   */
  getExchange(): TExchangeTransferable {
    const exchange = this.producibleMessage.getExchange();
    if (!exchange) {
      throw new MessageMessageExchangeRequiredError();
    }
    return exchange;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  /**
   * Sets the consumer group ID associated with the message envelope.
   *
   * @param consumerGroupId - The consumer group ID to be associated with the message envelope.
   *
   * @returns {MessageEnvelope} - The updated message envelope instance with the consumer group ID set.
   *
   * @remarks
   * The consumer group ID is used to group consumers that are interested in consuming messages from the same queue.
   * This allows for load balancing and parallel processing of messages within a consumer group.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setBody('Hello, world!').setQueue('my-queue');
   * const envelope = new MessageEnvelope(message);
   * envelope.setConsumerGroupId('my-consumer-group');
   * console.log(envelope.getConsumerGroupId()); // Output: 'my-consumer-group'
   * ```
   */
  setConsumerGroupId(consumerGroupId: string): MessageEnvelope {
    this.consumerGroupId = consumerGroupId;
    return this;
  }

  /**
   * Retrieves the consumer group ID associated with the message envelope.
   *
   * @returns {string | null} - The consumer group ID associated with the message envelope.
   *                           Returns `null` if no consumer group ID is set.
   *
   * @remarks
   * The consumer group ID is used to group consumers that are interested in consuming messages from the same queue.
   * This allows for load balancing and parallel processing of messages within a consumer group.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setBody('Hello, world!').setQueue('my-queue');
   * const envelope = new MessageEnvelope(message);
   * envelope.setConsumerGroupId('my-consumer-group');
   * console.log(envelope.getConsumerGroupId()); // Output: 'my-consumer-group'
   * ```
   */
  getConsumerGroupId(): string | null {
    return this.consumerGroupId;
  }

  /**
   * Converts the message envelope to a plain object representation.
   *
   * @returns {IMessageParams} - A plain object containing the properties of the message envelope.
   *
   * @remarks
   * This function creates a new object containing the properties of the message envelope,
   * including the message's creation timestamp, TTL, retry threshold, retry delay, consume timeout,
   * body, priority, scheduled CRON, scheduled delay, scheduled repeat period, scheduled repeat,
   * exchange, destination queue, and consumer group ID.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setBody('Hello, world!').setQueue('my-queue');
   * const envelope = new MessageEnvelope(message);
   * const messageParams = envelope.toJSON();
   * console.log(messageParams);
   * // Output:
   * // {
   * //   createdAt: 1642678800000,
   * //   ttl: 3600000,
   * //   retryThreshold: 3,
   * //   retryDelay: 10000,
   * //   consumeTimeout: 60000,
   * //   body: 'Hello, world!',
   * //   priority: 0,
   * //   scheduledCron: null,
   * //   scheduledDelay: null,
   * //   scheduledRepeatPeriod: null,
   * //   scheduledRepeat: 0,
   * //   exchange: { name: 'my-exchange', type: 'direct' },
   * //   destinationQueue: { name: 'my-queue' },
   * //   consumerGroupId: null
   * // }
   * ```
   */
  toJSON(): IMessageParams {
    return {
      createdAt: this.producibleMessage.getCreatedAt(),
      ttl: this.producibleMessage.getTTL(),
      retryThreshold: this.producibleMessage.getRetryThreshold(),
      retryDelay: this.producibleMessage.getRetryDelay(),
      consumeTimeout: this.producibleMessage.getConsumeTimeout(),
      body: this.producibleMessage.getBody(),
      priority: this.producibleMessage.getPriority(),
      scheduledCron: this.producibleMessage.getScheduledCRON(),
      scheduledDelay: this.producibleMessage.getScheduledDelay(),
      scheduledRepeatPeriod: this.producibleMessage.getScheduledRepeatPeriod(),
      scheduledRepeat: this.producibleMessage.getScheduledRepeat(),
      exchange: this.getExchange(),
      destinationQueue: this.getDestinationQueue(),
      consumerGroupId: this.getConsumerGroupId(),
    };
  }

  /**
   * Transfers the message envelope to a transferable format.
   *
   * @returns {IMessageTransferable} - The transferable representation of the message envelope.
   *
   * @remarks
   * This function creates a new object containing the properties of the message envelope,
   * including the message state, status, and transferable representation of the producible message.
   * The transferable representation includes the message's ID, createdAt timestamp, TTL, retryThreshold,
   * retryDelay, consumeTimeout, body, priority, scheduledCron, scheduledDelay, scheduledRepeatPeriod,
   * scheduledRepeat, exchange, destinationQueue, and consumerGroupId.
   *
   * @example
   * ```typescript
   * const message = new ProducibleMessage().setBody('Hello, world!').setQueue('my-queue');
   * const envelope = new MessageEnvelope(message);
   * const transferableMessage = envelope.transfer();
   * console.log(transferableMessage);
   * // Output:
   * // {
   * //   id: 'message-id',
   * //   createdAt: 1642678800000,
   * //   ttl: 3600000,
   * //   retryThreshold: 3,
   * //   retryDelay: 10000,
   * //   consumeTimeout: 60000,
   * //   body: 'Hello, world!',
   * //   priority: 0,
   * //   scheduledCron: null,
   * //   scheduledDelay: null,
   * //   scheduledRepeatPeriod: null,
   * //   scheduledRepeat: 0,
   * //   exchange: { name: 'my-exchange', type: 'direct' },
   * //   destinationQueue: { name: 'my-queue' },
   * //   consumerGroupId: null,
   * //   messageState: { attempts: 0, nextScheduledDelay: null, scheduledCronFired: false, messageScheduledRepeatCount: 0 },
   * //   status: 'UNPUBLISHED'
   * // }
   * ```
   */
  transfer(): IMessageTransferable {
    return {
      ...this.toJSON(),
      id: this.getId(),
      messageState: this.getMessageState().toJSON(),
      status: this.getStatus(),
    };
  }
  /**
   * Checks if the retry threshold for the message has been exceeded.
   *
   * @returns {boolean} - Returns `true` if the retry threshold has been exceeded,
   *                      indicating that the message should not be retried anymore.
   *                      Returns `false` if the retry threshold has not been exceeded,
   *                      indicating that the message can still be retried.
   *
   * @remarks
   * The retry threshold is defined by the `retryThreshold` property of the `ProducibleMessage` associated with the message envelope.
   * The function compares the current number of attempts (obtained from the `messageState`) with the retry threshold.
   * If the current attempts plus one (to account for the current attempt) is greater than or equal to the retry threshold,
   * the function returns `true`, indicating that the retry threshold has been exceeded.
   * Otherwise, the function returns `false`, indicating that the retry threshold has not been exceeded.
   *
   * @example
   * ```typescript
   * const message = new MessageEnvelope(new ProducibleMessage('Hello, world!', { retryThreshold: 3 }));
   * message.messageState.incrAttempts(); // Increment attempts by 1
   * message.messageState.incrAttempts(); // Increment attempts by 1
   * console.log(message.hasRetryThresholdExceeded()); // Output: false
   * message.messageState.incrAttempts(); // Increment attempts by 1
   * console.log(message.hasRetryThresholdExceeded()); // Output: true
   * ```
   */
  hasRetryThresholdExceeded(): boolean {
    const threshold = this.producibleMessage.getRetryThreshold();
    return this.messageState.getAttempts() + 1 >= threshold;
  }

  /**
   * Checks if the message is schedulable based on its delay and periodic settings.
   *
   * @returns {boolean} - Returns `true` if the message envelope is schedulable (either has a delay or is periodic),
   *                      otherwise `false`.
   *
   * @remarks
   * A schedulable message envelope is one that is intended to be delivered at a specific time in the future, either due to a delay or a periodic schedule.
   *
   * @example
   * ```typescript
   * const message = new MessageEnvelope(new ProducibleMessage('Hello, world!'));
   * message.setScheduledDelay(60000); // Schedule message to be delivered in 1 minute
   * console.log(message.isSchedulable()); // Output: true
   *
   * const message2 = new MessageEnvelope(new ProducibleMessage('Hello, world!'));
   * message2.setScheduledCRON('* * * * *'); // Schedule message every minute
   * console.log(message2.isSchedulable()); // Output: true
   *
   * const message3 = new MessageEnvelope(new ProducibleMessage('Hello, world!'));
   * console.log(message3.isSchedulable()); // Output: false
   * ```
   */
  isSchedulable(): boolean {
    return this.hasNextDelay() || this.isPeriodic();
  }

  /**
   * Checks if the message is periodic based on its scheduling settings.
   *
   * @returns {boolean} - Returns `true` if the message is periodic (either scheduled with CRON or has a repeat count greater than 0),
   *                      otherwise `false`.
   *
   * @remarks
   * A periodic message is one that is intended to be delivered at regular intervals, either based on a CRON schedule or a repeat count.
   *
   * @example
   * ```typescript
   * const message = new MessageEnvelope(new ProducibleMessage('Hello, world!'));
   * message.setScheduledCRON('* * * * *'); // Schedule message every minute
   * console.log(message.isPeriodic()); // Output: true
   *
   * const message2 = new MessageEnvelope(new ProducibleMessage('Hello, world!'));
   * message2.setScheduledRepeat(5); // Schedule message to repeat 5 times
   * console.log(message2.isPeriodic()); // Output: true
   *
   * const message3 = new MessageEnvelope(new ProducibleMessage('Hello, world!'));
   * console.log(message3.isPeriodic()); // Output: false
   * ```
   */
  isPeriodic(): boolean {
    return (
      this.producibleMessage.getScheduledCRON() !== null ||
      this.producibleMessage.getScheduledRepeat() > 0
    );
  }
}
