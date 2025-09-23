/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { QueueRateLimit } from '../../src/index.js';

export async function getQueueRateLimit() {
  const instance = new QueueRateLimit();
  return bluebird.promisifyAll(instance);
}
