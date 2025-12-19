/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
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
  protected uuid: string;

  // The timestamp when the message was published.
  protected publishedAt: number | null = null;

  // The timestamp when message processing started.
  protected processingStartedAt: number | null = null;

  // The timestamp when the message was requeued.
  protected requeuedAt: number | null = null;

  // The number of times the message has been requeued.
  protected requeueCount = 0;

  // The timestamp when the message was last requeued.
  protected lastRequeuedAt: number | null = null;

  // The timestamp when the message was dead-lettered.
  protected deadLetteredAt: number | null = null;

  // The timestamp when the message was acknowledged.
  protected acknowledgedAt: number | null = null;

  // The timestamp when the message was unacknowledged.
  protected unacknowledgedAt: number | null = null;

  // The timestamp when the message was last unacknowledged.
  protected lastUnacknowledgedAt: number | null = null;

  // The timestamp when the message was scheduled for processing.
  protected scheduledAt: number | null = null;

  // The timestamp when the message was last scheduled for processing.
  protected lastScheduledAt: number | null = null;

  // The timestamp of the last retry attempt.
  protected lastRetriedAttemptAt: number | null = null;

  // Indicates if the scheduled cron job for the message has fired.
  protected scheduledCronFired = false;

  // The number of attempts made to process the message.
  protected attempts = 0;

  // The number of times the message has been scheduled for processing.
  protected scheduledRepeatCount = 0;

  // Indicates if the message has expired.
  protected expired = false;

  // The delay in milliseconds that is currently active and will be used for the next scheduled execution.
  protected effectiveScheduledDelay = 0;

  // The number of times the message has been scheduled for processing.
  protected scheduledTimes = 0;

  // The unique identifier of the scheduled message that this message was created from.
  protected scheduledMessageParentId: string | null = null;

  // The unique identifier of the acknowledged/dead-lettered message that this message was created from.
  protected requeuedMessageParentId: string | null = null;

  /**
   * Creates a new instance of `MessageState` with a unique identifier.
   */
  constructor() {
    this.uuid = uuid();
  }

  /**
   * Creates a `MessageState` instance from a transferable object.
   *
   * @param state - The transferable message state object.
   * @returns A new instance of `MessageState`.
   */
  static fromJSON(state: IMessageStateTransferable): MessageState {
    const instance = new MessageState();
    instance.uuid = state.uuid;
    instance.publishedAt = state.publishedAt;
    instance.processingStartedAt = state.processingStartedAt;
    instance.requeuedAt = state.requeuedAt;
    instance.requeueCount = state.requeueCount;
    instance.lastRequeuedAt = state.lastRequeuedAt;
    instance.deadLetteredAt = state.deadLetteredAt;
    instance.acknowledgedAt = state.acknowledgedAt;
    instance.unacknowledgedAt = state.unacknowledgedAt;
    instance.lastUnacknowledgedAt = state.lastUnacknowledgedAt;
    instance.scheduledAt = state.scheduledAt;
    instance.lastScheduledAt = state.lastScheduledAt;
    instance.lastRetriedAttemptAt = state.lastRetriedAttemptAt;
    instance.scheduledCronFired = state.scheduledCronFired;
    instance.attempts = state.attempts;
    instance.scheduledRepeatCount = state.scheduledRepeatCount;
    instance.expired = state.expired;
    instance.effectiveScheduledDelay = state.effectiveScheduledDelay;
    instance.scheduledTimes = state.scheduledTimes;
    instance.scheduledMessageParentId = state.scheduledMessageParentId;
    instance.requeuedMessageParentId = state.requeuedMessageParentId;
    return instance;
  }

  /**
   * Sets the unique identifier of the message.
   *
   * @param id - The unique identifier (UUID) of the message.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setId(id: string): MessageState {
    this.uuid = id;
    return this;
  }

  /**
   * Retrieves the unique identifier of the message.
   *
   * @returns The unique identifier (UUID) of the message.
   */
  getId(): string {
    return this.uuid;
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
   * Sets the processing started timestamp for the message.
   *
   * @param timestamp - The timestamp (in milliseconds) when message processing started.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setProcessingStartedAt(timestamp: number): MessageState {
    this.processingStartedAt = timestamp;
    return this;
  }

  /**
   * Retrieves the timestamp when message processing started.
   *
   * @returns The timestamp (in milliseconds) when message processing started, or `null` if processing hasn't started.
   */
  getProcessingStartedAt(): number | null {
    return this.processingStartedAt;
  }

  /**
   * Sets the requeued timestamp for the message.
   *
   * @param timestamp - The timestamp (in milliseconds) when the message was requeued.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setRequeuedAt(timestamp: number): MessageState {
    this.requeuedAt = timestamp;
    return this;
  }

  /**
   * Retrieves the timestamp when the message was requeued.
   *
   * @returns The timestamp (in milliseconds) when the message was requeued, or `null` if not requeued.
   */
  getRequeuedAt(): number | null {
    return this.requeuedAt;
  }

  /**
   * Sets the requeue count for the message.
   *
   * @param count - The number of times the message has been requeued.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setRequeueCount(count: number): MessageState {
    this.requeueCount = count;
    return this;
  }

  /**
   * Retrieves the number of times the message has been requeued.
   *
   * @returns The number of times the message has been requeued.
   */
  getRequeueCount(): number {
    return this.requeueCount;
  }

  /**
   * Increments the requeue count of the message by 1.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  incrRequeueCount(): MessageState {
    this.requeueCount += 1;
    return this;
  }

  /**
   * Sets the last requeued timestamp for the message.
   *
   * @param timestamp - The timestamp (in milliseconds) when the message was last requeued.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setLastRequeuedAt(timestamp: number): MessageState {
    this.lastRequeuedAt = timestamp;
    return this;
  }

  /**
   * Retrieves the timestamp when the message was last requeued.
   *
   * @returns The timestamp (in milliseconds) when the message was last requeued, or `null` if not requeued.
   */
  getLastRequeuedAt(): number | null {
    return this.lastRequeuedAt;
  }

  /**
   * Sets the dead-lettered timestamp for the message.
   *
   * @param timestamp - The timestamp (in milliseconds) when the message was dead-lettered.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setDeadLetteredAt(timestamp: number): MessageState {
    this.deadLetteredAt = timestamp;
    return this;
  }

  /**
   * Retrieves the timestamp when the message was dead-lettered.
   *
   * @returns The timestamp (in milliseconds) when the message was dead-lettered, or `null` if not dead-lettered.
   */
  getDeadLetteredAt(): number | null {
    return this.deadLetteredAt;
  }

  /**
   * Sets the acknowledged timestamp for the message.
   *
   * @param timestamp - The timestamp (in milliseconds) when the message was acknowledged.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setAcknowledgedAt(timestamp: number): MessageState {
    this.acknowledgedAt = timestamp;
    return this;
  }

  /**
   * Retrieves the timestamp when the message was acknowledged.
   *
   * @returns The timestamp (in milliseconds) when the message was acknowledged, or `null` if not acknowledged.
   */
  getAcknowledgedAt(): number | null {
    return this.acknowledgedAt;
  }

  /**
   * Sets the unacknowledged timestamp for the message.
   *
   * @param timestamp - The timestamp (in milliseconds) when the message was unacknowledged.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setUnacknowledgedAt(timestamp: number): MessageState {
    this.unacknowledgedAt = timestamp;
    return this;
  }

  /**
   * Retrieves the timestamp when the message was unacknowledged.
   *
   * @returns The timestamp (in milliseconds) when the message was unacknowledged, or `null` if not acknowledged.
   */
  getUnacknowledgedAt(): number | null {
    return this.unacknowledgedAt;
  }

  /**
   * Sets the last unacknowledged timestamp for the message.
   *
   * @param timestamp - The timestamp (in milliseconds) when the message was last unacknowledged.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setLastUnacknowledgedAt(timestamp: number | null): MessageState {
    this.lastUnacknowledgedAt = timestamp;
    return this;
  }

  /**
   * Retrieves the timestamp when the message was last unacknowledged.
   *
   * @returns The timestamp (in milliseconds) when the message was last unacknowledged, or `null` if not acknowledged.
   */
  getLastUnacknowledgedAt(): number | null {
    return this.lastUnacknowledgedAt;
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
    return this;
  }

  /**
   * Retrieves the timestamp when the message was last scheduled for processing.
   *
   * @returns The timestamp (in milliseconds) when the message was last scheduled for processing, or `null` if never scheduled.
   */
  getLastScheduledAt(): number | null {
    return this.lastScheduledAt;
  }

  /**
   * Sets the timestamp of the last retry attempt.
   *
   * @param timestamp - The timestamp (in milliseconds) of the last retry attempt.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setLastRetriedAttemptAt(timestamp: number): this {
    this.lastRetriedAttemptAt = timestamp;
    return this;
  }

  /**
   * Retrieves the timestamp of the last retry attempt.
   *
   * @returns The timestamp (in milliseconds) of the last retry attempt, or `null` if never retried.
   */
  getLastRetriedAttemptAt(): number | null {
    return this.lastRetriedAttemptAt;
  }

  /**
   * Sets the flag indicating whether the message's scheduled cron job has fired.
   *
   * @param fired - A boolean indicating whether the scheduled cron job has fired.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setScheduledCronFired(fired: boolean): MessageState {
    this.scheduledCronFired = fired;
    return this;
  }

  /**
   * Retrieves the flag indicating whether the message's scheduled cron job has fired.
   *
   * @returns A boolean indicating whether the scheduled cron job has fired.
   */
  isScheduledCronFired(): boolean {
    return this.scheduledCronFired;
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
   * Retrieves the number of attempts made to process the message.
   *
   * @returns The current number of attempts made to process the message.
   */
  getAttempts(): number {
    return this.attempts;
  }

  /**
   * Sets the scheduled repeat count of the message.
   *
   * @param count - The new scheduled repeat count.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setScheduledRepeatCount(count: number): this {
    this.scheduledRepeatCount = count;
    return this;
  }

  /**
   * Retrieves the scheduled repeat count of the message.
   *
   * @returns The current scheduled repeat count.
   */
  getScheduledRepeatCount(): number {
    return this.scheduledRepeatCount;
  }

  /**
   * Increments the scheduled repeat count of the message by 1 and returns the updated count.
   *
   * @returns The updated scheduled repeat count.
   */
  incrScheduledRepeatCount(): number {
    this.scheduledRepeatCount += 1;
    return this.scheduledRepeatCount;
  }

  /**
   * Resets the scheduled repeat count of the message to 0.
   *
   * This method is used to reset the scheduled repeat count of a message back to its initial state.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  resetScheduledRepeatCount(): MessageState {
    this.scheduledRepeatCount = 0;
    return this;
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
      this.expired = createdAt + ttl - curTime <= 0;
    }
    return this.expired;
  }

  /**
   * Sets the expiration status of the message.
   *
   * This method is usefull when retrieving message state from Redis.
   *
   * @param expired - A boolean indicating whether the message has expired.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setExpired(expired: boolean): MessageState {
    this.expired = expired;
    return this;
  }

  /**
   * Retrieves the expiration status of the message.
   *
   * @returns A boolean indicating whether the message has expired.
   */
  getExpired(): boolean {
    return this.expired;
  }

  /**
   * Sets the effective scheduled delay for the message.
   *
   * This method updates the `effectiveScheduledDelay` property with the provided delay value.
   * The delay value represents the time in milliseconds until the message should be scheduled for processing.
   *
   * @param delay - The effective scheduled delay in milliseconds.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  setEffectiveScheduledDelay(delay: number): MessageState {
    this.effectiveScheduledDelay = delay;
    return this;
  }

  /**
   * Retrieves the current effective scheduled delay value without resetting it.
   *
   * @returns The effective scheduled delay in milliseconds.
   */
  getEffectiveScheduledDelay(): number {
    return this.effectiveScheduledDelay;
  }

  /**
   * Retrieves and resets the effective scheduled delay for the message.
   *
   * This method retrieves the value of the `effectiveScheduledDelay` property and resets it to 0.
   * If the `effectiveScheduledDelay` is greater than 0, it means a scheduled delay has been set for the message.
   * In such cases, the method returns the scheduled delay and resets it to 0.
   * If no scheduled delay is set (i.e., `effectiveScheduledDelay` is 0 or negative), the method returns 0.
   *
   * @returns The effective scheduled delay in milliseconds. If a scheduled delay is set, it will be returned and reset to 0.
   *          If no scheduled delay is set, 0 will be returned.
   */
  getSetEffectiveScheduledDelay(): number {
    if (this.effectiveScheduledDelay > 0) {
      const delay = this.effectiveScheduledDelay;
      this.effectiveScheduledDelay = 0;
      return delay;
    }
    return 0;
  }

  /**
   * Checks if the message has a pending delay.
   *
   * This function checks if the message has a pending delays for processing.
   * It checks the `effectiveScheduledDelay` to determine if either delay is greater than 0.
   * If either delay is greater than 0, it means there is a pending delay and the function returns `true`.
   * If both delays are 0 or negative, it means there are no pending delay and the function returns `false`.
   *
   * @returns A boolean indicating whether the message has a pending delay.
   *          Returns `true` if there is a pending delay, otherwise `false`.
   */
  hasDelay(): boolean {
    return this.effectiveScheduledDelay > 0;
  }

  /**
   * Sets the number of times the message has been scheduled.
   *
   * @param count - The number of times the message has been scheduled.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setScheduledTimes(count: number): MessageState {
    this.scheduledTimes = count;
    return this;
  }

  /**
   * Retrieves the number of times the message has been scheduled.
   *
   * @returns The number of times the message has been scheduled.
   */
  getScheduledTimes(): number {
    return this.scheduledTimes;
  }

  /**
   * Increments the number of times the message has been scheduled.
   *
   * @param count - The number to increment by. Defaults to 1.
   * @returns The current instance of `MessageState` for method chaining.
   */
  incrScheduledTimes(count = 1): MessageState {
    this.scheduledTimes = this.scheduledTimes + count;
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
  setScheduledMessageParentId(messageId: string): MessageState {
    this.scheduledMessageParentId = messageId;
    return this;
  }

  /**
   * Retrieves the unique identifier of the parent scheduled message.
   *
   * @returns The unique identifier of the parent message, or `null`.
   */
  getScheduledMessageParentId(): string | null {
    return this.scheduledMessageParentId;
  }

  /**
   * Sets the unique identifier of the parent requeued message.
   *
   * @param messageId - The unique identifier of the parent message.
   * @returns The current instance of `MessageState` for method chaining.
   */
  setRequeuedMessageParentId(messageId: string): MessageState {
    this.requeuedMessageParentId = messageId;
    return this;
  }

  /**
   * Retrieves the unique identifier of the parent requeued message.
   *
   * @returns The unique identifier of the parent message, or `null`.
   */
  getRequeuedMessageParentId(): string | null {
    return this.requeuedMessageParentId;
  }

  /**
   * Resets the message state to its initial values.
   *
   * @returns The current instance of `MessageState` for method chaining.
   */
  reset(): MessageState {
    this.publishedAt = null;
    this.processingStartedAt = null;
    this.requeuedAt = null;
    this.requeueCount = 0;
    this.lastRequeuedAt = null;
    this.deadLetteredAt = null;
    this.acknowledgedAt = null;
    this.unacknowledgedAt = null;
    this.lastUnacknowledgedAt = null;
    this.scheduledAt = null;
    this.lastScheduledAt = null;
    this.lastRetriedAttemptAt = null;
    this.attempts = 0;
    this.expired = false;
    this.effectiveScheduledDelay = 0;
    this.scheduledCronFired = false;
    this.scheduledRepeatCount = 0;
    this.scheduledTimes = 0;
    this.scheduledMessageParentId = null;
    this.requeuedMessageParentId = null;
    return this;
  }

  /**
   * Converts the current message state into a transferable object.
   *
   * @returns An object representing the transferable state of the message.
   */
  toJSON(): IMessageStateTransferable {
    return {
      uuid: this.uuid,
      publishedAt: this.publishedAt,
      processingStartedAt: this.processingStartedAt,
      requeuedAt: this.requeuedAt,
      requeueCount: this.requeueCount,
      lastRequeuedAt: this.lastRequeuedAt,
      deadLetteredAt: this.deadLetteredAt,
      acknowledgedAt: this.acknowledgedAt,
      unacknowledgedAt: this.unacknowledgedAt,
      lastUnacknowledgedAt: this.lastUnacknowledgedAt,
      scheduledAt: this.scheduledAt,
      lastScheduledAt: this.lastScheduledAt,
      lastRetriedAttemptAt: this.lastRetriedAttemptAt,
      scheduledCronFired: this.scheduledCronFired,
      attempts: this.attempts,
      scheduledRepeatCount: this.scheduledRepeatCount,
      expired: this.expired,
      effectiveScheduledDelay: this.effectiveScheduledDelay,
      scheduledTimes: this.scheduledTimes,
      scheduledMessageParentId: this.scheduledMessageParentId,
      requeuedMessageParentId: this.requeuedMessageParentId,
    };
  }

  /**
   * Retrieves all property values of the message state as a tuple.
   *
   * This method is useful for serialization or for passing the message state values to other components.
   * The order of values in the tuple corresponds to the order of properties defined in `IMessageStateTransferable`.
   *
   * @returns A tuple containing the values of the message state properties.
   */
  getValues(): [
    IMessageStateTransferable['uuid'],
    IMessageStateTransferable['publishedAt'],
    IMessageStateTransferable['processingStartedAt'],
    IMessageStateTransferable['requeuedAt'],
    IMessageStateTransferable['requeueCount'],
    IMessageStateTransferable['lastRequeuedAt'],
    IMessageStateTransferable['deadLetteredAt'],
    IMessageStateTransferable['acknowledgedAt'],
    IMessageStateTransferable['unacknowledgedAt'],
    IMessageStateTransferable['lastUnacknowledgedAt'],
    IMessageStateTransferable['scheduledAt'],
    IMessageStateTransferable['lastScheduledAt'],
    IMessageStateTransferable['lastRetriedAttemptAt'],
    IMessageStateTransferable['scheduledCronFired'],
    IMessageStateTransferable['attempts'],
    IMessageStateTransferable['scheduledRepeatCount'],
    IMessageStateTransferable['expired'],
    IMessageStateTransferable['effectiveScheduledDelay'],
    IMessageStateTransferable['scheduledTimes'],
    IMessageStateTransferable['scheduledMessageParentId'],
    IMessageStateTransferable['requeuedMessageParentId'],
  ] {
    return [
      this.uuid,
      this.publishedAt,
      this.processingStartedAt,
      this.requeuedAt,
      this.requeueCount,
      this.lastRequeuedAt,
      this.deadLetteredAt,
      this.acknowledgedAt,
      this.unacknowledgedAt,
      this.lastUnacknowledgedAt,
      this.scheduledAt,
      this.lastScheduledAt,
      this.lastRetriedAttemptAt,
      this.scheduledCronFired,
      this.attempts,
      this.scheduledRepeatCount,
      this.expired,
      this.effectiveScheduledDelay,
      this.scheduledTimes,
      this.scheduledMessageParentId,
      this.requeuedMessageParentId,
    ];
  }
}
