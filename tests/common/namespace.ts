/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { Namespace } from '../../src/lib/index.js';

const instances: Namespace[] = [];

export async function getNamespace() {
  const instance = new Namespace();
  instances.push(instance);
  return bluebird.promisifyAll(instance);
}

export async function shutDownNamespace() {
  for (const i of instances) {
    await bluebird.promisifyAll(i).shutdownAsync();
  }
}
