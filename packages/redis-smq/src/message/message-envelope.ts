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
  protected status: EMessagePropertyStatus = EMessagePropertyStatus.NEW;
  protected destinationQueue: IQueueParams | null = null;
  protected consumerGroupId: string | null = null;

  constructor(
    producibleMessage: ProducibleMessage,
    messageState: MessageState | null = null,
    status: EMessagePropertyStatus = EMessagePropertyStatus.NEW,
  ) {
    this.producibleMessage = producibleMessage;
    if (messageState) this.messageState = messageState;
    else {
      this.messageState = new MessageState();
      const scheduledDelay = this.producibleMessage.getScheduledDelay();
      if (scheduledDelay)
        this.messageState.setEffectiveScheduledDelay(scheduledDelay);
    }
    this.status = status;
  }

  /**
   * Retrieves the message state associated with the message envelope.
   *
   * @returns {MessageState} - The message state object containing information about the message's attempts,
   *                           effective scheduled delay, scheduled cron firing status, and message scheduled repeat count.
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
   * console.log(messageState.getEffectiveScheduledDelay()); // Output: null
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
   * the effective scheduled delay, whether the scheduled CRON has been fired, and the count of repeated message deliveries.
   *
   * @example
   * ```typescript
   * const message = new MessageEnvelope(new ProducibleMessage('Hello, world!'));
   * const messageState = new MessageState();
   * messageState.incrAttempts(); // Increment attempts by 1
   * messageState.setEffectiveScheduledDelay(60000); // Schedule message to be delivered in 1 minute
   * message.setMessageState(messageState);
   * console.log(message.getMessageState()); // Output: { attempts: 1, effectiveScheduledDelay: 60000, scheduledCronFired: false, messageScheduledRepeatCount: 0 }
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
   * Calculates the next scheduled timestamp for a message based on its scheduling
   * parameters (delay, CRON, repeat).
   *
   * The scheduling priority is as follows:
   * 1.  **Delay**: If a delay is set, it takes precedence. The message is scheduled
   *     for `now + delay`.
   * 2.  **CRON & Repeat**:
   *     - If both CRON and repeat are set, the CRON expression acts as a trigger.
   *       On each CRON tick, a new repeat cycle begins.
   *     - The next timestamp is the earliest of the next CRON time or the next
   *       repeat time.
   *     - If the CRON time is chosen, the repeat counter is reset.
   * 3.  **CRON only**: The next timestamp is the next time matching the CRON expression.
   * 4.  **Repeat only**: The message is repeated a fixed number of times.
   *
   * @returns The next scheduled timestamp in milliseconds, or `0` if the message
   *          is not schedulable or the schedule has ended.
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
    if (!this.isSchedulable()) {
      return 0;
    }

    const messageState = this.getMessageState();
    const now = Date.now();

    // A message with a delay is not periodic and is delivered only once.
    const delay = messageState.getSetEffectiveScheduledDelay();
    if (delay) {
      return now + delay;
    }

    const producibleMessage = this.producibleMessage;
    const cronExpression = producibleMessage.getScheduledCRON();
    const repeatLimit = producibleMessage.getScheduledRepeat();

    // No periodic scheduling defined
    if (!cronExpression && !repeatLimit) {
      return 0;
    }

    // Calculate next CRON timestamp
    const cronTimestamp = cronExpression
      ? cronParser.parseExpression(cronExpression).next().getTime()
      : 0;

    // Calculate next Repeat timestamp
    let repeatTimestamp = 0;
    const currentRepeatCount = messageState.getScheduledRepeatCount();
    if (currentRepeatCount < repeatLimit) {
      // For a message with CRON and REPEAT scheduling, REPEAT is active
      // only after the first CRON tick.
      const isCronFired = messageState.isScheduledCronFired();
      if (!cronExpression || isCronFired) {
        const repeatPeriod = producibleMessage.getScheduledRepeatPeriod() ?? 0;
        if (cronExpression) {
          // For CRON + REPEAT, all repeats are delayed by the period
          repeatTimestamp = now + repeatPeriod;
        } else {
          // For REPEAT only, the first repeat is immediate, subsequent repeats are
          // delayed by the period.
          repeatTimestamp = currentRepeatCount > 0 ? now + repeatPeriod : now;
        }
      }
    }

    // Determine the final timestamp based on the scheduling parameters
    // and update message state accordingly.

    if (cronTimestamp && repeatTimestamp) {
      if (repeatTimestamp < cronTimestamp) {
        messageState.incrScheduledRepeatCount();
        return repeatTimestamp;
      }
      // CRON tick takes precedence and resets the repeat cycle
      messageState.resetScheduledRepeatCount();
      messageState.setScheduledCronFired(true);
      return cronTimestamp;
    }

    if (cronTimestamp) {
      messageState.resetScheduledRepeatCount();
      messageState.setScheduledCronFired(true);
      return cronTimestamp;
    }

    if (repeatTimestamp) {
      messageState.incrScheduledRepeatCount();
      return repeatTimestamp;
    }

    // The schedule has ended (e.g., repeat limit reached).
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
   * //   messageState: { attempts: 0, effectiveScheduledDelay: null, scheduledCronFired: false, messageScheduledRepeatCount: 0 },
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
    return this.messageState.getAttempts() >= threshold;
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
