import { v4 as uuid } from 'uuid';
import { TMessageState } from '../../../types';

export class MessageState {
  protected readonly uuid: string;

  protected publishedAt: number | null = null;

  protected scheduledAt: number | null = null;

  protected scheduledCronFired = false;

  protected attempts = 0;

  protected scheduledRepeatCount = 0;

  protected expired = false;

  protected nextScheduledDelay = 0;

  protected nextRetryDelay = 0;

  constructor() {
    this.uuid = uuid();
  }

  setPublishedAt(timestamp: number): MessageState {
    this.publishedAt = timestamp;
    return this;
  }

  setScheduledAt(timestamp: number): MessageState {
    this.scheduledAt = timestamp;
    return this;
  }

  setNextScheduledDelay(delay: number): MessageState {
    this.nextScheduledDelay = delay;
    return this;
  }

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

  getSetNextRetryDelay(): number {
    if (this.nextRetryDelay > 0) {
      const delay = this.nextRetryDelay;
      this.nextRetryDelay = 0;
      return delay;
    }
    return 0;
  }

  hasDelay(): boolean {
    return this.nextScheduledDelay > 0 || this.nextRetryDelay > 0;
  }

  resetMessageScheduledRepeatCount(): MessageState {
    this.scheduledRepeatCount = 0;
    return this;
  }

  incrAttempts(): number {
    this.setAttempts(this.attempts + 1);
    return this.attempts;
  }

  setAttempts(attempts: number): MessageState {
    this.attempts = attempts;
    return this;
  }

  setMessageScheduledCronFired(fired: boolean): MessageState {
    this.scheduledCronFired = fired;
    return this;
  }

  incrMessageScheduledRepeatCount(): number {
    this.scheduledRepeatCount += 1;
    return this.scheduledRepeatCount;
  }

  setExpired(expired: boolean): MessageState {
    this.expired = expired;
    return this;
  }

  reset(): MessageState {
    this.publishedAt = null;
    this.scheduledAt = null;
    this.attempts = 0;
    this.expired = false;
    this.nextScheduledDelay = 0;
    this.scheduledCronFired = false;
    this.scheduledRepeatCount = 0;
    return this;
  }

  getPublishedAt(): number | null {
    return this.publishedAt;
  }

  getScheduledAt(): number | null {
    return this.scheduledAt;
  }

  getAttempts(): number {
    return this.attempts;
  }

  getMessageScheduledRepeatCount(): number {
    return this.scheduledRepeatCount;
  }

  getId(): string {
    return this.uuid;
  }

  hasScheduledCronFired(): boolean {
    return this.scheduledCronFired;
  }

  hasExpired(): boolean {
    return this.expired;
  }

  getSetExpired(ttl: number, createdAt: number): boolean {
    if (!this.hasExpired()) {
      const messageTTL = ttl;
      if (messageTTL) {
        const curTime = new Date().getTime();
        const expired = createdAt + messageTTL - curTime <= 0;
        this.setExpired(expired);
        return expired;
      }
      return false;
    }
    return true;
  }

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

  toJSON(): TMessageState {
    return {
      uuid: this.uuid,
      publishedAt: this.publishedAt,
      scheduledAt: this.scheduledAt,
      scheduledCronFired: this.scheduledCronFired,
      attempts: this.attempts,
      scheduledRepeatCount: this.scheduledRepeatCount,
      expired: this.expired,
      nextScheduledDelay: this.nextScheduledDelay,
      nextRetryDelay: this.nextRetryDelay,
    };
  }
}
