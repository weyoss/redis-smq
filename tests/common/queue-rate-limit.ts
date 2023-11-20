/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { promisifyAll } from 'bluebird';
import { QueueRateLimit } from '../../src/lib/queue/queue-rate-limit';

export async function getQueueRateLimit() {
  return promisifyAll(new QueueRateLimit());
}
