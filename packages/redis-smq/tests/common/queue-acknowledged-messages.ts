/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { QueueAcknowledgedMessages } from '../../src/lib/index.js';

const instances: QueueAcknowledgedMessages[] = [];

export async function getQueueAcknowledgedMessages() {
  const instance = new QueueAcknowledgedMessages();
  instances.push(instance);
  return bluebird.promisifyAll(instance);
}

export async function shutDownQueueAcknowledgedMessages() {
  for (const i of instances) {
    await bluebird.promisifyAll(i).shutdownAsync();
  }
}
