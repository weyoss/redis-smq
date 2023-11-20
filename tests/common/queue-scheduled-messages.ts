/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { promisifyAll } from 'bluebird';
import { QueueScheduledMessages } from '../../src/lib/queue/queue-scheduled-messages';

export async function getQueueScheduledMessages() {
  return promisifyAll(new QueueScheduledMessages());
}
