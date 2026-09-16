/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ERedisConnectionAcquisitionMode } from '../../src/common/redis/connection-pool/types/connection-pool.js';
import { Pool } from '../../src/common/redis/connection-pool/pool.js';

export async function getRedisInstance() {
  const p = bluebird.promisifyAll(Pool.getInstance());
  const c = await p.acquireAsync(ERedisConnectionAcquisitionMode.EXCLUSIVE);
  return bluebird.promisifyAll(c);
}
