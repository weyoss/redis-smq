/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { EventBusNotConnectedError } from './errors/index.js';
import { IEventBusConfig, TEventBusEvent } from './types/index.js';
import { Runnable } from '../runnable/index.js';
import { createLogger, ILogger } from '../logger/index.js';
import { ICallback } from '../async/index.js';

/**
 * EventBus with optional namespace support.
 */
export class EventBus<Events extends TEventBusEvent> extends Runnable<Events> {
  private readonly namespace: string;
  protected logger: ILogger;

  constructor(config: IEventBusConfig = {}, namespace = '') {
    super();
    this.logger = createLogger(config?.logger);
    this.namespace = namespace ? `${namespace}:` : '';
  }

  /**
   * Compute the namespaced event name.
   * 'error' is never namespaced.
   */
  protected toNamespacedEvent(event: string): string {
    return event === 'error' ? 'error' : `${this.namespace}${event}`;
  }

  /**
   * Emit an event.
   * - 'error' events are always emitted unprefixed.
   * - Non-error events are namespaced if a namespace is configured.
   * - Non-error events require the bus to be running; otherwise an error is emitted and false is returned.
   */
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
    this.eventEmitter.emit(namespacedEvent, ...args);
    return true;
  }

  /**
   * Add a listener for an event.
   * - 'error' listeners are registered unprefixed.
   * - Non-error listeners are registered with namespace if configured.
   */
  override on<E extends keyof Events>(event: E, listener: Events[E]): this {
    const namespacedEvent = this.toNamespacedEvent(String(event));
    this.eventEmitter.on(namespacedEvent, listener);
    return this;
  }

  /**
   * Add a one-time listener for an event.
   * - 'error' listeners are registered unprefixed.
   * - Non-error listeners are registered with namespace if configured.
   */
  override once<E extends keyof Events>(event: E, listener: Events[E]): this {
    const namespacedEvent = this.toNamespacedEvent(String(event));
    this.eventEmitter.once(namespacedEvent, listener);
    return this;
  }

  override removeListener<E extends keyof Events>(
    event: E,
    listener: Events[E],
  ): this {
    const namespacedEvent = this.toNamespacedEvent(String(event));
    this.eventEmitter.removeListener(namespacedEvent, listener);
    return this;
  }

  /**
   * Remove all listeners for an event or all events.
   */
  override removeAllListeners<E extends keyof Events>(event?: E): this {
    const namespacedEvent = event
      ? this.toNamespacedEvent(String(event))
      : undefined;
    return super.removeAllListeners(namespacedEvent);
  }

  /**
   * Ensure all listeners are removed on shutdown.
   */
  protected override goingDown(): ((cb: ICallback<void>) => void)[] {
    return [
      (cb: ICallback) => {
        super.removeAllListeners();
        cb();
      },
    ].concat(super.goingDown());
  }
}
