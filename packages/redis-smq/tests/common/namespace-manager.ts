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

export async function getNamespaceManager() {
  const instance = new NamespaceManager();
  return bluebird.promisifyAll(instance);
}
