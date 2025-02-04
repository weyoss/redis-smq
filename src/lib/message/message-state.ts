/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { v4 as uuid } from 'uuid';
import { IMessageStateTransferable } from './types/index.js';

/**
 * Represents the state of a message in RedisSMQ.
 *
 * The `MessageState` class encapsulates the properties and methods related to the state of a message.
 * It provides methods to update and retrieve information about the message, such as its unique identifier,
 * timestamps, scheduling information, retry attempts, and expiration status.
 */
export class MessageState {
  // The unique identifier of the message state which serves as the message ID.
  protected readonly uuid: string;

  // The timestamp when the message was published.
  protected publishedAt: number | null = null;

  // The timestamp when the message was scheduled for processing.
  protected scheduledAt: number | null = null;

  // The timestamp when the message was last scheduled for processing.
  protected lastScheduledAt: number | null = null;

  // Indicates if the scheduled cron job for the message has fired.
  protected scheduledCronFired = false;

  // The number of attempts made to process the message.
  protected attempts = 0;

  // The number of times the message has been scheduled for processing.
  protected scheduledRepeatCount = 0;

  // Indicates if the message has expired.
  protected expired = false;

  // The delay in milliseconds before the next scheduled processing attempt.
  protected nextScheduledDelay = 0;

  // The delay in milliseconds before the next retry attempt.
  protected nextRetryDelay = 0;

  // The number of times the message has been scheduled for processing.
  protected scheduledTimes = 0;

  // The unique identifier of the scheduled message that this message was created from.
  protected scheduledMessageId: string | null = null;

  /**
   * Creates a new instance of `MessageState` with a unique identifier.
   */
  constructor() {
    this.uuid = uuid();
  }

  /**
   * Updates the timestamp of when the message was published.
   *
   * @param timestamp - The timestamp (in milliseconds) when the message was published.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setPublishedAt(timestamp: number): MessageState {
    this.publishedAt = timestamp;
    return this;
  }

  /**
   * Updates the timestamp of when the message was scheduled for processing.
   *
   * @param timestamp - The timestamp (in milliseconds) when the message was scheduled for processing.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setScheduledAt(timestamp: number): MessageState {
    this.scheduledAt = timestamp;
    return this;
  }

  /**
   * Updates the timestamp of the last scheduled message processing and increments the scheduled times counter.
   *
   * This method is used to keep track of the number of times a message has been scheduled for processing.
   * It also updates the timestamp of the last scheduled processing.
   *
   * @param timestamp - The timestamp (in milliseconds) when the message was last scheduled for processing.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setLastScheduledAt(timestamp: number): MessageState {
    this.lastScheduledAt = timestamp;
    this.scheduledTimes += 1;
    return this;
  }

  /**
   * Sets the unique identifier of the scheduled message that this message was created from.
   *
   * This method is used to keep track of messages that were created and published based on the original message that was scheduled.
   * When a scheduled message has to be published, RedisSMQ creates a new message with the same body and properties as the original
   * scheduled message along with the unique identifier of the original message. This identifier can be used to identify and manage the original message in case it is needed.
   *
   * @param messageId - The unique identifier of the message that this message was scheduled to replace.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setScheduledMessageId(messageId: string): MessageState {
    this.scheduledMessageId = messageId;
    return this;
  }

  /**
   * Sets the next scheduled delay for the message.
   *
   * This method updates the `nextScheduledDelay` property with the provided delay value.
   * The delay value represents the time in milliseconds until the message should be scheduled for processing.
   *
   * @param delay - The next scheduled delay in milliseconds.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setNextScheduledDelay(delay: number): MessageState {
    this.nextScheduledDelay = delay;
    return this;
  }

  /**
   * Retrieves and resets the next scheduled delay for the message.
   *
   * This method retrieves the value of the `nextScheduledDelay` property and resets it to 0.
   * If the `nextScheduledDelay` is greater than 0, it means a scheduled delay has been set for the message.
   * In such cases, the method returns the scheduled delay and resets it to 0.
   * If no scheduled delay is set (i.e., `nextScheduledDelay` is 0 or negative), the method returns 0.
   *
   * @returns The next scheduled delay in milliseconds. If a scheduled delay is set, it will be returned and reset to 0.
   *          If no scheduled delay is set, 0 will be returned.
   */
  getSetNextScheduledDelay(): number {
    if (this.nextScheduledDelay > 0) {
      const delay = this.nextScheduledDelay;
      this.nextScheduledDelay = 0;
      return delay;
    }
    return 0;
  }

  setNextRetryDelay(delay: number): MessageState {
    this.nextRetryDelay = delay;
    return this;
  }

  /**
   * Retrieves and resets the next retry delay for the message.
   * If a retry delay is set, it will be returned and then reset to 0.
   * If no retry delay is set, 0 will be returned.
   *
   * @returns The next retry delay in milliseconds.
   */
  getSetNextRetryDelay(): number {
    if (this.nextRetryDelay > 0) {
      const delay = this.nextRetryDelay;
      this.nextRetryDelay = 0;
      return delay;
    }
    return 0;
  }

  /**
   * Checks if the message has any pending delays (scheduled or retry).
   *
   * This function checks if the message has any pending delays for processing.
   * It checks the `nextScheduledDelay` and `nextRetryDelay` properties to determine if either delay is greater than 0.
   * If either delay is greater than 0, it means there is a pending delay and the function returns `true`.
   * If both delays are 0 or negative, it means there are no pending delays and the function returns `false`.
   *
   * @returns A boolean indicating whether the message has any pending delays.
   *          Returns `true` if there is a pending delay, otherwise `false`.
   */
  hasDelay(): boolean {
    return this.nextScheduledDelay > 0 || this.nextRetryDelay > 0;
  }

  /**
   * Resets the scheduled repeat count of the message to 0.
   *
   * This method is used to reset the scheduled repeat count of a message back to its initial state.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  resetMessageScheduledRepeatCount(): MessageState {
    this.scheduledRepeatCount = 0;
    return this;
  }

  /**
   * Increments the number of attempts made to process the message and returns the updated count.
   *
   * @returns The updated number of attempts.
   */
  incrAttempts(): number {
    this.setAttempts(this.attempts + 1);
    return this.attempts;
  }

  /**
   * Updates the number of attempts made to process the message.
   *
   * @param attempts - The new number of attempts. This value should be greater than or equal to 0.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setAttempts(attempts: number): MessageState {
    this.attempts = attempts;
    return this;
  }

  /**
   * Sets the flag indicating whether the message's scheduled cron job has fired.
   *
   * @param fired - A boolean indicating whether the scheduled cron job has fired.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setMessageScheduledCronFired(fired: boolean): MessageState {
    this.scheduledCronFired = fired;
    return this;
  }

  /**
   * Increments the scheduled repeat count of the message by 1 and returns the updated count.
   *
   * @returns The updated scheduled repeat count.
   */
  incrMessageScheduledRepeatCount(): number {
    this.scheduledRepeatCount += 1;
    return this.scheduledRepeatCount;
  }

  /**
   * Updates the expiration status of the message.
   *
   * This method sets the `expired` property of the message state to the provided value.
   * The expiration status indicates whether the message has reached its Time To Live (TTL) and should be considered expired.
   *
   * @param expired - A boolean value indicating whether the message should be considered expired.
   *                  If `true`, the message will be marked as expired.
   *                  If `false`, the message will not be marked as expired.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setExpired(expired: boolean): MessageState {
    this.expired = expired;
    return this;
  }

  /**
   * Resets the message state to its initial values.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  reset(): MessageState {
    this.publishedAt = null;
    this.scheduledAt = null;
    this.lastScheduledAt = null;
    this.attempts = 0;
    this.expired = false;
    this.nextScheduledDelay = 0;
    this.scheduledCronFired = false;
    this.scheduledRepeatCount = 0;
    this.scheduledTimes = 0;
    return this;
  }

  /**
   * Retrieves the timestamp when the message was published.
   *
   * This method returns the timestamp (in milliseconds) when the message was initially published.
   * If the message was not published, it returns `null`.
   *
   * @returns The timestamp (in milliseconds) when the message was published, or `null` if not published.
   */
  getPublishedAt(): number | null {
    return this.publishedAt;
  }

  /**
   * Retrieves the timestamp when the message was scheduled for processing.
   *
   * This method returns the timestamp (in milliseconds) when the message was initially scheduled for processing.
   * If the message was not scheduled for processing, it returns `null`.
   *
   * @returns The timestamp (in milliseconds) when the message was scheduled for processing, or `null` if not scheduled.
   */
  getScheduledAt(): number | null {
    return this.scheduledAt;
  }

  /**
   * Retrieves the number of attempts made to process the message.
   *
   * This method returns the current count of attempts made to process the message.
   * Each time a message is processed, the attempt count is incremented by 1.
   *
   * @returns The current number of attempts made to process the message.
   */
  getAttempts(): number {
    return this.attempts;
  }

  /**
   * Retrieves the number of times the message has been scheduled for processing.
   *
   * This method returns the current count of times the message has been scheduled for processing.
   * Each time a message is scheduled for processing, the scheduled repeat count is incremented by 1.
   *
   * @returns The current number of times the message has been scheduled for processing.
   */
  getMessageScheduledRepeatCount(): number {
    return this.scheduledRepeatCount;
  }

  /**
   * Retrieves the unique identifier of the message state.
   *
   * This method returns the unique identifier (UUID) of the message state instance.
   * The UUID is a 128-bit value that serves as a unique identifier for each message state.
   *
   * @returns The unique identifier of the message state as a string.
   */
  getId(): string {
    return this.uuid;
  }

  /**
   * Checks if the scheduled cron job for the message has fired.
   *
   * This method returns the value of the `scheduledCronFired` property, which indicates whether the scheduled cron job has been triggered.
   *
   * @returns A boolean value indicating whether the scheduled cron job has fired.
   *          Returns `true` if the cron job has fired, otherwise `false`.
   */
  hasScheduledCronFired(): boolean {
    return this.scheduledCronFired;
  }

  /**
   * Checks if the message has expired based on the provided Time To Live (TTL) and creation timestamp.
   *
   * @returns A boolean indicating whether the message has expired.
   *          Returns `true` if the message has expired, otherwise `false`.
   */
  hasExpired(): boolean {
    return this.expired;
  }

  /**
   * Updates the expiration status of the message based on the provided TTL (Time To Live) and creation timestamp.
   * If a TTL is provided, it checks if the message has expired based on the current time and the creation timestamp.
   * The expiration status is then set accordingly.
   *
   * @param ttl - The Time To Live in milliseconds. If 0 or negative, the message will never expire.
   * @param createdAt - The timestamp (in milliseconds) when the message was created.
   *
   * @returns A boolean indicating whether the message has expired.
   */
  getSetExpired(ttl: number, createdAt: number): boolean {
    if (ttl) {
      const curTime = new Date().getTime();
      const expired = createdAt + ttl - curTime <= 0;
      this.setExpired(expired);
    }
    return this.hasExpired();
  }

  /**
   * Retrieves and sets the next delay for the message based on retry and scheduled delays.
   * If a retry delay is set, it will be returned. If not, the scheduled delay will be checked.
   * If neither delay is set, 0 will be returned.
   *
   * @returns The next delay in milliseconds.
   */
  getSetNextDelay(): number {
    const retryDelay = this.getSetNextRetryDelay();
    if (retryDelay) {
      return retryDelay;
    }
    const scheduledDelay = this.getSetNextScheduledDelay();
    if (scheduledDelay) {
      return scheduledDelay;
    }
    return 0;
  }

  /**
   * Retrieves the unique identifier of the scheduled message that this message was created from.
   *
   * This method is used to keep track of messages that were created and published based on the original message that was scheduled.
   * When a scheduled message has to be published, RedisSMQ creates a new message with the same body and properties as the original
   * scheduled message along with the unique identifier of the original message. This identifier can be used to identify and manage the original message in case it is needed.
   *
   * @returns The unique identifier of the scheduled message that this message was created from.
   *          If this message was created from no scheduled message, it returns `null`.
   */
  getScheduledMessageId(): string | null {
    return this.scheduledMessageId;
  }

  /**
   * Converts the current message state into a transferable object.
   *
   * This method is used to serialize the message state into a format that can be easily transferred between different processes or systems.
   * The returned object contains all the relevant properties of the message state, such as the unique identifier, timestamps,
   * scheduling information, retry attempts, and expiration status.
   *
   * @returns An object representing the transferable state of the message.
   */
  toJSON(): IMessageStateTransferable {
    return {
      uuid: this.uuid,
      publishedAt: this.publishedAt,
      scheduledAt: this.scheduledAt,
      lastScheduledAt: this.lastScheduledAt,
      scheduledCronFired: this.scheduledCronFired,
      scheduledTimes: this.scheduledTimes,
      attempts: this.attempts,
      scheduledRepeatCount: this.scheduledRepeatCount,
      expired: this.expired,
      nextScheduledDelay: this.nextScheduledDelay,
      nextRetryDelay: this.nextRetryDelay,
      scheduledMessageId: this.scheduledMessageId,
    };
  }
}
