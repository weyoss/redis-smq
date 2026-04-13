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
 * Singleton distributed event bus for RedisSMQ.
 *
 * Provides Redis-based event communication across components and deployments.
 * Must be started with `run()` before events are delivered.
 *
 * @example
 * const eventBus = EventBus.getInstance();
 * await eventBus.run();
 *
 * eventBus.on('queue.queueCreated', (queue, properties) => {
 *   console.log('Queue created:', queue.name);
 * });
 */
export class EventBus {
  private static instance: EventBusRedis<TRedisSMQEvent> | null = null;

  protected constructor() {}

  /**
   * Gets the singleton event bus instance.
   *
   * @returns EventBusRedis instance
   *
   * @example
   * const eventBus = EventBus.getInstance();
   * await eventBus.run();
   */
  static getInstance() {
    if (!EventBus.instance) {
      const redis = RedisConfig.getConfig();
      EventBus.instance = new EventBusRedis<TRedisSMQEvent>({ redis }, 'user');
    }
    return EventBus.instance;
  }

  /**
   * Shuts down the event bus and releases resources.
   *
   * @param cb - (err) => void
   * @returns Promise if no callback, otherwise void
   *
   * @example
   * // Promise
   * await EventBus.shutdown();
   *
   * // Callback
   * EventBus.shutdown((err) => {
   *   if (err) throw err;
   * });
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
