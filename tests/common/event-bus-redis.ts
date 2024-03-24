/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { EventBusRedisInstance } from '../../src/lib/event-bus/event-bus-redis-instance.js';

const eventBus = bluebird.promisifyAll(new EventBusRedisInstance());

export async function getEventBus() {
  return eventBus.getSetInstanceAsync();
}

export async function shutDownEventBus() {
  return eventBus.shutdownAsync();
}
