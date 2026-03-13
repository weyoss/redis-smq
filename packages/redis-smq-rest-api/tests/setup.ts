/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { Consumer, ProducibleMessage, RedisSMQ } from 'redis-smq';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { config } from './common/config.js';
import {
  getRedisClientInstance,
  shutdownRedisClient,
} from './common/redis-client.js';
import { redisSMQConfig } from './common/redis-smq-config.js';
import { startApiServer, stopApiServer } from './common/start-api-server.js';
import {
  initializeRedis,
  shutDownRedisServer,
} from './common/start-redis-server.js';
import { BackoffConfig } from 'redis-smq-common';

const RedisSMQAsync = bluebird.promisifyAll(RedisSMQ);

beforeAll(async () => {
  await initializeRedis();
});

afterAll(async () => {
  await shutdownRedisClient();
  await shutDownRedisServer();
});

beforeEach(async () => {
  const redis = await getRedisClientInstance();
  await redis.flushallAsync();
  await RedisSMQAsync.initializeWithConfigAsync({
    ...redisSMQConfig,
    redis: config.redis,
  });
  await RedisSMQAsync.shutdownAsync();
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

  await startApiServer();
});

afterEach(async () => {
  await stopApiServer();
  await RedisSMQAsync.shutdownAsync();
});
