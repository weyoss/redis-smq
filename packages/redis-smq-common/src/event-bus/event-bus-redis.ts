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
    // 'error' is a local-only signal, never published to Redis. This
    // matches the base EventBus behavior and avoids a feedback loop.
    if (event === 'error') {
      return super.emit(event, ...args);
    }

    if (!this.isOperational()) {
      this.eventEmitter.emit('error', new EventBusNotConnectedError());
      return false;
    }

    const namespacedEvent = this.toNamespacedEvent(String(event));

    // JSON.stringify throws on circular references and BigInt. Serialize
    // inside a try so the failure is routed to the bus's error channel
    // rather than escaping into the caller's call stack.
    let payload: string;
    try {
      payload = JSON.stringify(args);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error(
        `Failed to serialize event [${namespacedEvent}]: ${error.message}`,
        error,
      );
      this.handleError(error);
      return false;
    }

    // The publish callback is not a no-op. A failed publish is a real
    // condition the caller needs to know about — otherwise a message
    // silently vanishes when the Redis connection is unhealthy.
    this.pubClient.getInstance().publish(namespacedEvent, payload, (err) => {
      if (err) {
        this.logger.error(
          `Failed to publish event [${namespacedEvent}]: ${err.message}`,
          err,
        );
        this.handleError(err);
      }
    });
    return true;
  }

  // Always register listeners locally; subscription is managed separately and idempotently.
  override on<E extends keyof Events>(event: E, listener: Events[E]): this {
    super.on(event, listener);
    this.ensureSubscribed(this.toNamespacedEvent(String(event)));
    return this;
  }

  override once<E extends keyof Events>(event: E, listener: Events[E]): this {
    super.once(event, listener);
    this.ensureSubscribed(this.toNamespacedEvent(String(event)));
    return this;
  }

  override removeListener<E extends keyof Events>(
    event: E,
    listener: Events[E],
  ): this {
    super.removeListener(event, listener);
    this.reconcileSubscription(String(event));
    return this;
  }

  override removeAllListeners<E extends keyof Events>(
    event?: Extract<E, string>,
  ): this {
    super.removeAllListeners(event);
    if (event) {
      this.reconcileSubscription(String(event));
    } else {
      this.ensureUnsubscribed();
    }
    return this;
  }

  /**
   * Reconcile the Redis subscription state for a logical event name
   * against the local listener count.
   *
   * The listener count is measured against the *namespaced* name — the
   * name under which `EventBus.on` / `EventBus.once` register handlers.
   * Measuring against the un-namespaced name (as a previous version did)
   * reads 0 whenever the two differ, causing the bus to unsubscribe from
   * a Redis channel that still has local listeners waiting on it. Any
   * listener that registered after the first removal then receives
   * nothing, and its awaiter hangs until timeout.
   *
   * Called after every removal so the two pieces of state — the emitter's
   * listener list and the Redis subscription set — cannot drift.
   */
  private reconcileSubscription(event: string): void {
    if (event === 'error') return;

    const namespacedEvent = this.toNamespacedEvent(event);
    const remaining = this.eventEmitter.listenerCount(namespacedEvent);
    if (remaining > 0) {
      this.ensureSubscribed(namespacedEvent);
    } else {
      this.ensureUnsubscribed(namespacedEvent);
    }
  }

  // Centralized, idempotent subscription management (DRY)
  private ensureSubscribed(namespacedEvent: string): void {
    if (namespacedEvent === 'error') return;
    if (!this.isOperational()) return;
    if (this.subscribedEvents.has(namespacedEvent)) return;

    this.subClient.getInstance().subscribe(namespacedEvent);
    this.subscribedEvents.add(namespacedEvent);
  }

  private ensureUnsubscribed(namespacedEvent?: string): void {
    if (namespacedEvent === 'error') return;

    if (!namespacedEvent) {
      if (this.subscribedEvents.size > 0) {
        this.subClient.getInstance().unsubscribe();
        this.subscribedEvents.clear();
      }
      return;
    }

    if (this.subscribedEvents.has(namespacedEvent)) {
      this.subClient.getInstance().unsubscribe(namespacedEvent);
      this.subscribedEvents.delete(namespacedEvent);
    }
  }

  private syncSubscriptionsWithListeners(): void {
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
      (cb: ICallback) => {
        this.ensureUnsubscribed();
        cb();
      },
      (cb: ICallback) => this.subClient.shutdown(cb),
      (cb: ICallback) => this.pubClient.shutdown(cb),
    ].concat(super.goingDown());
  }
}
