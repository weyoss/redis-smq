/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ProducibleMessage, RedisSMQ } from '../../src/index.js';
import { config } from './config.js';
import { RedisClient } from '../../src/common/redis/redis-client/redis-client.js';

const RedisSMQAsync = bluebird.promisifyAll(RedisSMQ);

export async function startUp(): Promise<void> {
  const redisClient = bluebird.promisifyAll(new RedisClient(config.redis));
  const instance = bluebird.promisifyAll(
    await redisClient.getSetInstanceAsync(),
  );
  await instance.flushallAsync();
  await instance.shutdownAsync();

  await RedisSMQAsync.initializeWithConfigAsync(config);

  ProducibleMessage.setDefaultConsumeOptions({
    ttl: 0,
    retryThreshold: 3,
    retryDelay: 0,
    consumeTimeout: 0,
  });
}
