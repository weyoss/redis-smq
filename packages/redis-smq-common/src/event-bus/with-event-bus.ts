/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { async } from '../async/index.js';
import { ICallback } from '../async/index.js';
import { EventBusRedisFactory } from './event-bus-redis-factory.js';
import { IEventBus, TEventBusEvent } from './types/index.js';

/**
 * A helper function for executing operations with an event bus instance
 *
 * This function provides a standardized way to:
 * 1. Get or create an event bus instance
 * 2. Execute an operation with the event bus
 * 3. Handle the callback with the result
 *
 * @param eventBusRedisFactory - The factory that provides the event bus instance
 * @param operation - The operation to execute with the event bus
 * @param callback - The callback to invoke with the final result
 * @typeparam S - The type of events supported by the event bus
 * @typeparam T - The type of data returned by the operation
 */
export function withEventBus<S extends TEventBusEvent, T>(
  eventBusRedisFactory: EventBusRedisFactory<S>,
  operation: (eventBus: IEventBus<S>, cb: ICallback<T>) => void,
  callback: ICallback<T>,
): void {
  async.withCallback(
    (cb) => eventBusRedisFactory.getSetInstance(cb),
    operation,
    callback,
  );
}
