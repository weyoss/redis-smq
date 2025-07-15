/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { QueueDeadLetteredMessages } from '../../src/index.js';

const instances: QueueDeadLetteredMessages[] = [];

export async function getQueueDeadLetteredMessages() {
  const instance = new QueueDeadLetteredMessages();
  instances.push(instance);
  return bluebird.promisifyAll(instance);
}

export async function shutDownQueueDeadLetteredMessages() {
  for (const i of instances) {
    await bluebird.promisifyAll(i).shutdownAsync();
  }
}
