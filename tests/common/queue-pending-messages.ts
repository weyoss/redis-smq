/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { promisifyAll } from 'bluebird';
import { QueuePendingMessages } from '../../src/lib/queue/queue-pending-messages';

export async function getQueuePendingMessages() {
  return promisifyAll(new QueuePendingMessages());
}
