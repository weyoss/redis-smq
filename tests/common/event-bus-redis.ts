/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { EventBus } from '../../src/lib/index.js';

const eventBus = bluebird.promisifyAll(new EventBus());

export async function getEventBus() {
  return eventBus.getSetInstanceAsync();
}

export async function shutDownEventBus() {
  return eventBus.shutdownAsync();
}
