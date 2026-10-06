/*
 * packages/redis-smq-rest-api/tests/setup/vitest.setup.ts
 */

import { RedisSMQ } from 'redis-smq';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { config } from '../helpers/config.js';
import {
  getRedisClientInstance,
  shutdownRedisClient,
} from '../helpers/redis-client.js';
import { redisSMQConfig } from '../helpers/redis-smq-config.js';
import { startApiServer, stopApiServer } from '../helpers/start-api-server.js';
import {
  initializeRedis,
  shutDownRedisServer,
} from '../helpers/start-redis-server.js';
import { BackoffConfig } from 'redis-smq-common';

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
  await RedisSMQ.initialize(config.redis!);
  await RedisSMQ.createConfigManager().updateConfig(redisSMQConfig);
  await RedisSMQ.shutdown();
  RedisSMQ.setDefaultMessageConsumeOptions({
    ttl: 0,
    retryThreshold: 3,
    retryDelay: 0,
    consumeTimeout: 0,
  });

  RedisSMQ.setDefaultConsumerOptions({
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
  await RedisSMQ.getEventBus().run();
});

afterEach(async () => {
  await stopApiServer();
  await RedisSMQ.shutdown();
});
