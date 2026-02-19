/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../async/index.js';
import { IEventBusRedisConfig, TEventBusEvent } from './types/index.js';
import { RedisClientFactory } from '../redis-client/index.js';
import {
  EventBusMessageJSONParseError,
  EventBusNotConnectedError,
} from './errors/index.js';
import { EventBus } from './event-bus.js';

export class EventBusRedis<
  Events extends TEventBusEvent,
> extends EventBus<Events> {
  protected pubClient: RedisClientFactory;
  protected subClient: RedisClientFactory;

  // Track active Redis subscriptions to avoid duplicate SUBSCRIBE/UNSUBSCRIBE
  private readonly subscribedEvents = new Set<string>();

  constructor(config: IEventBusRedisConfig, namespace = '') {
    super(config, namespace);
    this.pubClient = new RedisClientFactory(config.redis);
    this.pubClient.on('error', (err) => this.handleError(err));
    this.subClient = new RedisClientFactory(config.redis);
    this.subClient.on('error', (err) => this.handleError(err));
  }

  // Publish non-error events via Redis; let 'error' behave locally, consistent with EventBus
  override emit<E extends keyof Events>(
    event: E,
    ...args: Parameters<Events[E]>
  ): boolean {
    if (event === 'error') {
      return super.emit(event, ...args);
    }
    if (!this.isOperational()) {
      this.eventEmitter.emit('error', new EventBusNotConnectedError());
      return false;
    }
    const namespacedEvent = this.toNamespacedEvent(String(event));
    this.pubClient
      .getInstance()
      .publish(namespacedEvent, JSON.stringify(args), () => void 0);
    return true;
  }

  // Always register listeners locally; subscription is managed separately and idempotently.
  override on<E extends keyof Events>(event: E, listener: Events[E]): this {
    super.on(event, listener);
    const namespacedEvent = this.toNamespacedEvent(String(event));
    this.ensureSubscribed(namespacedEvent);
    return this;
  }

  override once<E extends keyof Events>(event: E, listener: Events[E]): this {
    super.once(event, listener);
    const namespacedEvent = this.toNamespacedEvent(String(event));
    this.ensureSubscribed(namespacedEvent);
    return this;
  }

  override removeListener<E extends keyof Events>(
    event: E,
    listener: Events[E],
  ): this {
    super.removeListener(event, listener);
    // Unsubscribe if there are no more listeners for this event
    if (
      event !== 'error' &&
      this.eventEmitter.listenerCount(String(event)) === 0
    ) {
      const namespacedEvent = this.toNamespacedEvent(String(event));
      this.ensureUnsubscribed(namespacedEvent);
    }
    return this;
  }

  override removeAllListeners<E extends keyof Events>(
    event?: Extract<E, string>,
  ): this {
    super.removeAllListeners(event);
    if (event && event !== 'error') {
      const namespacedEvent = this.toNamespacedEvent(String(event));
      this.ensureUnsubscribed(namespacedEvent);
    } else if (!event) {
      this.ensureUnsubscribed(); // Unsubscribe from all
    }
    return this;
  }

  // Centralized, idempotent subscription management (DRY)
  private ensureSubscribed(eventName: string): void {
    if (
      eventName !== 'error' &&
      this.isOperational() &&
      !this.subscribedEvents.has(eventName)
    ) {
      this.subClient.getInstance().subscribe(eventName);
      this.subscribedEvents.add(eventName);
    }
  }

  private ensureUnsubscribed(eventName?: string): void {
    if (eventName === 'error') return;

    if (!eventName) {
      if (this.subscribedEvents.size > 0) {
        this.subClient.getInstance().unsubscribe();
        this.subscribedEvents.clear();
      }
      return;
    }

    if (this.subscribedEvents.has(eventName)) {
      this.subClient.getInstance().unsubscribe(eventName);
      this.subscribedEvents.delete(eventName);
    }
  }

  private syncSubscriptionsWithListeners(): void {
    // Subscribe to all existing non-error listener event names on startup
    if (!this.isOperational()) return;
    for (const name of this.getListenerEventNames()) {
      this.ensureSubscribed(name);
    }
  }

  private getListenerEventNames(): string[] {
    return this.eventEmitter
      .eventNames()
      .map((n) => String(n))
      .filter((n) => n !== 'error');
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      // Publisher
      (cb: ICallback) => this.pubClient.init(cb),
      (cb: ICallback) => {
        this.subClient.init((err) => {
          if (err) return cb(err);
          this.subClient
            .getInstance()
            .on('message', (channel: string, message: string) => {
              try {
                this.eventEmitter.emit(channel, ...JSON.parse(message));
              } catch (error) {
                this.handleError(
                  new EventBusMessageJSONParseError({
                    metadata: {
                      error: String(error),
                    },
                  }),
                );
              }
            });
          this.syncSubscriptionsWithListeners();
          cb();
        });
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      // Unsubscribe from all events
      (cb: ICallback) => {
        this.ensureUnsubscribed();
        cb();
      },
      (cb: ICallback) => this.subClient.shutdown(cb),
      (cb: ICallback) => this.pubClient.shutdown(cb),
    ].concat(super.goingDown());
  }
}
