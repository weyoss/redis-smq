/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { Queue } from '../../src/index.js';

const instances: Queue[] = [];

export async function getQueue() {
  const instance = new Queue();
  instances.push(instance);
  return bluebird.promisifyAll(instance);
}

export async function shutDownQueue() {
  for (const i of instances) {
    await bluebird.promisifyAll(i).shutdownAsync();
  }
}
