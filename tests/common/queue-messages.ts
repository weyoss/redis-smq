/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { promisifyAll } from 'bluebird';
import { QueueMessages } from '../../src/lib/queue/queue-messages/queue-messages';

export async function getQueueMessages() {
  return promisifyAll(new QueueMessages());
}
