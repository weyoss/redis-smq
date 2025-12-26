/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { Configuration } from '../config/index.js';
import { TRedisSMQEvent } from '../common/index.js';
import { EventBusRedis, ICallback } from 'redis-smq-common';

/**
 * The InternalEventBus class provides a singleton interface for accessing a
 * distributed (Redis-based) event bus that is used exclusively for internal
 * communication between redis-smq components.
 *
 * It is isolated from the public EventBus by using a channel prefix.
 */
export class InternalEventBus {
  private static instance: EventBusRedis<TRedisSMQEvent> | null = null;

  protected constructor() {}

  /**
   * Returns the singleton instance of the internal event bus.
   */
  static getInstance() {
    if (!InternalEventBus.instance) {
      const config = Configuration.getConfig();
      InternalEventBus.instance = new EventBusRedis<TRedisSMQEvent>(
        config,
        'system',
      );
    }
    return InternalEventBus.instance;
  }

  /**
   * Shuts down the internal event bus instance and releases its resources.
   * After shutdown, the instance is reset, and a new one will be created
   * on the next call to `getInstance()`.
   *
   * @param {ICallback<void>} cb - A callback to be invoked once shutdown is complete.
   */
  static shutdown(cb: ICallback<void>): void {
    if (InternalEventBus.instance)
      return InternalEventBus.instance.shutdown(() => {
        InternalEventBus.instance = null;
        cb();
      });
    cb();
  }
}
