/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ERedisConnectionAcquisitionMode } from '../../src/common/redis-connection-pool/types/index.js';
import { RedisConnectionPool } from '../../src/index.js';

export async function getRedisInstance() {
  const p = bluebird.promisifyAll(RedisConnectionPool.getInstance());
  const c = await p.acquireAsync(ERedisConnectionAcquisitionMode.EXCLUSIVE);
  return bluebird.promisifyAll(c);
}
