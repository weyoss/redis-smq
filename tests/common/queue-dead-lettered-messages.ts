/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { promisifyAll } from 'bluebird';
import { QueueDeadLetteredMessages } from '../../src/lib/queue/queue-dead-lettered-messages';

export async function getQueueDeadLetteredMessages() {
  return promisifyAll(new QueueDeadLetteredMessages());
}
