/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { RedisSMQ } from '../../src/index.js';

export async function getNamespaceManager() {
  return bluebird.promisifyAll(RedisSMQ.createNamespaceManager());
}
