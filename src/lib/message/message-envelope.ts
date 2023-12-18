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
} from '../../../types';
import { MessageState } from './message-state';
import {
  MessageDestinationQueueAlreadySetError,
  MessageDestinationQueueRequiredError,
  MessageExchangeRequiredError,
} from './errors';
import { ProducibleMessage } from './producible-message';

export class MessageEnvelope {
  protected messageState: MessageState;

  protected status: EMessagePropertyStatus = EMessagePropertyStatus.UNPUBLISHED;

  protected destinationQueue: IQueueParams | null = null;

  readonly producibleMessage;

  constructor(producibleMessage: ProducibleMessage) {
    this.producibleMessage = producibleMessage;
    this.messageState = new MessageState();
    const scheduledDelay = this.producibleMessage.getScheduledDelay();
    if (scheduledDelay) this.messageState.setNextScheduledDelay(scheduledDelay);
  }

  getMessageState(): MessageState {
    return this.messageState;
  }

  setMessageState(m: MessageState): MessageEnvelope {
    this.messageState = m;
    return this;
  }

  getPublishedAt(): number | null {
    return this.messageState.getPublishedAt();
  }

  getScheduledAt(): number | null {
    return this.messageState.getScheduledAt();
  }

  getScheduledMessageId(): string | null {
    return this.messageState.getScheduledMessageId();
  }

  getId(): string {
    return this.messageState.getId();
  }

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

  hasNextDelay(): boolean {
    return this.messageState.hasDelay();
  }

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
        ? parseExpression(msgScheduledCron).next().getTime()
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

  getExchange(): TExchange {
    const exchange = this.producibleMessage.getExchange();
    if (!exchange) {
      throw new MessageExchangeRequiredError();
    }
    return exchange;
  }

  toString(): string {
    return JSON.stringify(this);
  }

  toJSON(): IMessageSerialized {
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
      exchange: this.getExchange().toJSON(),
      destinationQueue: this.getDestinationQueue(),
    };
  }

  hasRetryThresholdExceeded(): boolean {
    const threshold = this.producibleMessage.getRetryThreshold();
    return this.messageState.getAttempts() + 1 >= threshold;
  }

  isSchedulable(): boolean {
    return this.hasNextDelay() || this.isPeriodic();
  }

  isPeriodic(): boolean {
    return (
      this.producibleMessage.getScheduledCRON() !== null ||
      this.producibleMessage.getScheduledRepeat() > 0
    );
  }
}
