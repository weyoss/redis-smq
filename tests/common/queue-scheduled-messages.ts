/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { QueueScheduledMessages } from '../../src/lib/index.js';

const instances: QueueScheduledMessages[] = [];

export async function getQueueScheduledMessages() {
  const instance = new QueueScheduledMessages();
  instances.push(instance);
  return bluebird.promisifyAll(instance);
}

export async function shutDownQueueScheduledMessages() {
  for (const i of instances) {
    await bluebird.promisifyAll(i).shutdownAsync();
  }
}
