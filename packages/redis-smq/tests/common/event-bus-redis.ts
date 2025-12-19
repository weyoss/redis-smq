/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { EventBus } from '../../src/index.js';

export async function getEventBus() {
  return bluebird.promisifyAll(EventBus.getInstance());
}
