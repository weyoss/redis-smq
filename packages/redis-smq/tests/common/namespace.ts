/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { NamespaceManager } from '../../src/index.js';

const instances: NamespaceManager[] = [];

export async function getNamespace() {
  const instance = new NamespaceManager();
  instances.push(instance);
  return bluebird.promisifyAll(instance);
}

export async function shutDownNamespace() {
  for (const i of instances) {
    await bluebird.promisifyAll(i).shutdownAsync();
  }
}
