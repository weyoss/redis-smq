/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ICallback } from '../async/index.js';
import { CallbackEmptyReplyError } from '../errors/index.js';
import { IEventBusRedisConfig, TEventBusEvent } from './types/index.js';
import { createRedisClient, IRedisClient } from '../redis-client/index.js';
import { EventBusError, EventBusNotConnectedError } from './errors/index.js';
import { EventBus } from './event-bus.js';

export class EventBusRedis<
  Events extends TEventBusEvent,
> extends EventBus<Events> {
  protected readonly redisConfig;
  protected pubClient: IRedisClient | null = null;
  protected subClient: IRedisClient | null = null;

  // Track active Redis subscriptions to avoid duplicate SUBSCRIBE/UNSUBSCRIBE
  private readonly subscribedEvents = new Set<string>();

  constructor(config: IEventBusRedisConfig) {
    super(config);
    this.redisConfig = config.redis;
  }

  // Publish non-error events via Redis; let 'error' behave locally, consistent with EventBus
  override emit<E extends keyof Events>(
    event: E,
    ...args: Parameters<Events[E]>
  ): boolean {
    if (event === 'error') {
      return super.emit(event, ...args);
    }
    if (!this.isRunning()) {
      this.eventEmitter.emit('error', new EventBusNotConnectedError());
      return false;
    }
    this.pubClient?.publish(String(event), JSON.stringify(args), () => void 0);
    return true;
  }

  // Always register listeners locally; subscription is managed separately and idempotently.
  override on<E extends keyof Events>(event: E, listener: Events[E]): this {
    super.on(event, listener);
    this.ensureSubscribed(String(event));
    return this;
  }

  override once<E extends keyof Events>(event: E, listener: Events[E]): this {
    super.once(event, listener);
    this.ensureSubscribed(String(event));
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
      this.ensureUnsubscribed(String(event));
    }
    return this;
  }

  override removeAllListeners<E extends keyof Events>(
    event?: Extract<E, string>,
  ): this {
    super.removeAllListeners(event);
    if (event && event !== 'error') {
      this.ensureUnsubscribed(String(event));
    } else if (!event) {
      this.ensureUnsubscribed(); // Unsubscribe from all
    }
    return this;
  }

  // Centralized, idempotent subscription management (DRY)
  private ensureSubscribed(eventName: string): void {
    if (
      eventName !== 'error' &&
      this.isRunning() &&
      !this.subscribedEvents.has(eventName)
    ) {
      this.subClient?.subscribe(eventName);
      this.subscribedEvents.add(eventName);
    }
  }

  private ensureUnsubscribed(eventName?: string): void {
    if (eventName === 'error') return;

    if (!eventName) {
      if (this.subscribedEvents.size > 0) {
        this.subClient?.unsubscribe();
        this.subscribedEvents.clear();
      }
      return;
    }

    if (this.subscribedEvents.has(eventName)) {
      this.subClient?.unsubscribe(eventName);
      this.subscribedEvents.delete(eventName);
    }
  }

  private syncSubscriptionsWithListeners(): void {
    // Subscribe to all existing non-error listener event names on startup
    if (!this.isRunning()) return;
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

  private createRedisClient(
    isSubscriber: boolean,
    cb: ICallback<IRedisClient>,
  ): void {
    createRedisClient(this.redisConfig, (err, client) => {
      if (err) return cb(err);
      if (!client)
        return cb(new EventBusError('Redis client initialization failed'));

      client.on('error', (e: Error) => this.handleError(e));

      if (isSubscriber) {
        client.on('message', (channel: string, message: string) => {
          try {
            this.eventEmitter.emit(channel, ...JSON.parse(message));
          } catch (parseError) {
            const err =
              parseError instanceof Error
                ? parseError
                : new EventBusError(String(parseError));
            this.handleError(err);
          }
        });
      }

      cb(null, client);
    });
  }

  private shutdownClient(
    client: IRedisClient | null,
    cb: ICallback<void>,
  ): void {
    if (client) client.halt(cb);
    else cb();
  }

  protected override goingUp(): ((cb: ICallback<void>) => void)[] {
    return super.goingUp().concat([
      // Publisher
      (cb: ICallback<void>) => {
        this.createRedisClient(false, (err, client) => {
          if (err) return cb(err);
          if (!client) return cb(new CallbackEmptyReplyError());
          this.pubClient = client;
          cb();
        });
      },
      // Subscriber + sync existing listeners
      (cb: ICallback<void>) => {
        this.createRedisClient(true, (err, client) => {
          if (err) return cb(err);
          if (!client) return cb(new CallbackEmptyReplyError());
          this.subClient = client;
          this.syncSubscriptionsWithListeners();
          cb();
        });
      },
    ]);
  }

  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      // Unsubscribe from all events
      (cb: ICallback<void>) => {
        this.ensureUnsubscribed();
        cb();
      },
      // Shutdown clients (DRY)
      (cb: ICallback<void>) =>
        this.shutdownClient(this.subClient, () => {
          this.subClient = null;
          cb();
        }),
      (cb: ICallback<void>) =>
        this.shutdownClient(this.pubClient, () => {
          this.pubClient = null;
          cb();
        }),
    ].concat(super.goingDown());
  }
}
