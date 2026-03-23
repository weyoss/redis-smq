/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { Consumer, ProducibleMessage, RedisSMQ } from '../../src/index.js';
import { config } from './config.js';
import { RedisClient } from '../../src/common/redis/redis-client/redis-client.js';
import { BackoffConfig } from 'redis-smq-common';

export async function startUp(): Promise<void> {
  const redisClient = bluebird.promisifyAll(new RedisClient(config.redis));
  const instance = bluebird.promisifyAll(
    await redisClient.getSetInstanceAsync(),
  );
  await instance.flushallAsync();
  await instance.shutdownAsync();

  await RedisSMQ.initializeWithConfig(config);

  ProducibleMessage.setDefaultConsumeOptions({
    ttl: 0,
    retryThreshold: 3,
    retryDelay: 0,
    consumeTimeout: 0,
  });

  Consumer.setDefaultOptions({
    heartbeatTTL: 3_000,
    batchAcks: {
      enabled: true,
      batchSize: 100,
      batchTimeoutMs: 1000,
    },
    batchUnacks: {
      enabled: true,
      batchSize: 100,
      batchTimeoutMs: 1000,
    },
  });

  BackoffConfig.setDefaultConfig({
    baseDelay: 1000,
    maxDelay: 3_000,
    jitter: false,
  });
}
