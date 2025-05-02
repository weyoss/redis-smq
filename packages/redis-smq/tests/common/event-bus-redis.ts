/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { EventBus } from '../../src/common/index.js';

let eventBus: ReturnType<typeof bluebird.promisifyAll<EventBus>> | null = null;

export async function getEventBus() {
  if (!eventBus) {
    eventBus = bluebird.promisifyAll(new EventBus());
  }
  return eventBus.getSetInstanceAsync();
}

export async function shutDownEventBus() {
  if (eventBus) await eventBus.shutdownAsync();
}
