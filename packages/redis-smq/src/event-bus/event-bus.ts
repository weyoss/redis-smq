/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async, EventBusRedis, ICallback } from 'redis-smq-common';
import { TRedisSMQEvent } from './types/index.js';
import { RedisConfig } from '../common/redis/redis-config.js';

/**
 * The EventBus class provides a singleton interface for accessing a
 * distributed (Redis-based) event bus.
 *
 * This allows components to communicate via events regardless of the deployment
 * topology.
 *
 * **Important:** The event bus must be explicitly started via `run()` to begin
 * consuming and delivering events. Events published before `run()` are not delivered.
 *
 * @example
 * ```typescript
 * // Get the event bus instance
 * const eventBus = EventBus.getInstance();
 *
 * // Start the event bus to begin consuming events
 * eventBus.run((err) => {
 *   if (err) console.error('Failed to start event bus:', err);
 * });
 *
 * // Subscribe to events (can be done before or after run())
 * eventBus.on('queue.stateChanged', (event) => {
 *   console.log('Queue state changed:', event);
 * });
 *
 * // Publish an event (only delivered if bus is running)
 * eventBus.emit('queue.stateChanged', { queue: 'orders', state: 'PAUSED' });
 * ```
 */
export class EventBus {
  private static instance: EventBusRedis<TRedisSMQEvent> | null = null;

  protected constructor() {}

  /**
   * Returns the singleton instance of the event bus.
   *
   * This method creates the event bus instance if it doesn't exist yet,
   * using the Redis configuration from `RedisConfig.getConfig()`.
   *
   * **Note:** The instance is created regardless of any configuration settings.
   * However, you must call `run()` on the returned instance to start consuming events.
   *
   * @returns The singleton EventBusRedis instance
   *
   * @example
   * ```typescript
   * // Get instance and start it
   * const eventBus = EventBus.getInstance();
   * await eventBus.run();
   *
   * // Subscribe to events
   * eventBus.on('queue.created', (data) => {
   *   console.log('Queue created:', data);
   * });
   * ```
   */
  static getInstance() {
    if (!EventBus.instance) {
      const redis = RedisConfig.getConfig();
      EventBus.instance = new EventBusRedis<TRedisSMQEvent>({ redis }, 'user');
    }
    return EventBus.instance;
  }

  /**
   * Shuts down the event bus instance and releases its resources.
   *
   * This method gracefully shuts down the Redis connections used by the event bus
   * and clears the singleton instance. After shutdown, a new instance will be
   * created on the next call to `getInstance()`.
   *
   * This is useful for:
   * - Graceful application shutdown
   * - Testing scenarios where you need to reset the event bus state
   *
   * **Note:** `RedisSMQ.shutdown()` automatically calls this method.
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
