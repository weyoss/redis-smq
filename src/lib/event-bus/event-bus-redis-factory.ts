/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { TUnaryFunction } from 'redis-smq-common';
import { EventBusRedisInstance } from './event-bus-redis-instance.js';

const instances: Record<string, EventBusRedisInstance> = {};

export function EventBusRedisFactory(
  id: string,
  onError: TUnaryFunction<Error>,
) {
  if (!instances[id]) {
    const instance = new EventBusRedisInstance();
    instance.on('error', onError);
    instances[id] = instance;
  }
  return instances[id];
}
