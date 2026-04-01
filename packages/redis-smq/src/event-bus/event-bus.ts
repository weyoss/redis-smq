/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Configuration } from '../config-manager/configuration.js';
import { async, EventBusRedis, ICallback } from 'redis-smq-common';
import { TRedisSMQEvent } from './types/index.js';

/**
 * The EventBus class provides a singleton interface for accessing a
 * distributed (Redis-based) event bus.
 *
 * This allows components to communicate via events regardless of the deployment
 * topology. For example, a queue pause event can be broadcast to all consumers,
 * whether they are in the same process or distributed across multiple nodes.
 *
 * @example
 * ```typescript
 * // Get the event bus instance
 * const eventBus = EventBus.getInstance();
 *
 * // Subscribe to events
 * eventBus.on('queue.stateChanged', (event) => {
 *   console.log('Queue state changed:', event);
 * });
 *
 * // Publish an event
 * eventBus.publish('queue.stateChanged', { queue: 'orders', state: 'PAUSED' });
 * ```
 */
export class EventBus {
  private static instance: EventBusRedis<TRedisSMQEvent> | null = null;

  protected constructor() {}

  /**
   * Returns the singleton instance of the event bus.
   *
   * This method creates the event bus instance if it doesn't exist yet,
   * using the configuration from `Configuration.getConfig()`. The instance
   * is cached for subsequent calls.
   *
   * @returns The singleton EventBusRedis instance
   *
   * @example
   * ```typescript
   * // Get instance and subscribe to events
   * const eventBus = EventBus.getInstance();
   * eventBus.on('queue.created', (data) => {
   *   console.log('Queue created:', data);
   * });
   *
   * // Get instance and publish an event
   * const eventBus = EventBus.getInstance();
   * eventBus.publish('queue.created', { name: 'orders', ns: 'default' });
   * ```
   */
  static getInstance() {
    if (!EventBus.instance) {
      const config = Configuration.getConfig();
      EventBus.instance = new EventBusRedis<TRedisSMQEvent>(config, 'user');
    }
    return EventBus.instance;
  }

  /**
   * Shuts down the event bus instance and releases its resources.
   *
   * This method gracefully shuts down the Redis connection used by the event bus
   * and clears the singleton instance. After shutdown, a new instance will be
   * created on the next call to `getInstance()`.
   *
   * This is useful for:
   * - Graceful application shutdown
   * - Testing scenarios where you need to reset the event bus state
   * - Reconfiguring the event bus with new settings
   *
   * @param cb - Optional callback invoked when shutdown completes
   * @returns {Promise<void> | void} - Returns a Promise if no callback is provided
   *
   * @example
   * ```typescript
   * // Callback pattern
   * EventBus.shutdown((err) => {
   *   if (err) {
   *     console.error('Failed to shutdown event bus:', err);
   *   } else {
   *     console.log('Event bus shut down successfully');
   *   }
   * });
   *
   * // Promise pattern
   * try {
   *   await EventBus.shutdown();
   *   console.log('Event bus shut down successfully');
   * } catch (err) {
   *   console.error('Failed to shutdown event bus:', err);
   * }
   * ```
   */
  static shutdown(): Promise<void>;
  static shutdown(cb: ICallback): void;
  static shutdown(cb?: ICallback): Promise<void> | void {
    return async.withOptionalCallback(cb, (callback) => {
      if (EventBus.instance)
        return EventBus.instance.shutdown(() => {
          EventBus.instance = null;
          callback();
        });
      callback();
    });
  }
}
