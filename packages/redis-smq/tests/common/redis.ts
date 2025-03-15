/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { createRedisClient, IRedisClient } from 'redis-smq-common';
import { Configuration } from '../../src/config/index.js';

const redisClients: IRedisClient[] = [];
const createInstanceAsync = bluebird.promisify(createRedisClient);

export async function getRedisInstance() {
  const c = await createInstanceAsync(Configuration.getSetConfig().redis);
  redisClients.push(c);
  return bluebird.promisifyAll(c);
}

export async function shutDownRedisClients() {
  while (redisClients.length) {
    const redisClient = redisClients.pop();
    if (redisClient) {
      await bluebird.promisifyAll(redisClient).haltAsync();
    }
  }
}
