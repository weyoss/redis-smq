/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQ } from 'redis-smq';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { TEST_REDIS_SMQ_CONFIG } from '../helpers/config.js';
import { clearContext, setContext } from '../helpers/context.js';
import { type RedisInstance, spawnRedis } from '../helpers/redis-server.js';
import { type ApiInstance, startApi } from '../helpers/start-api.js';
import { ERedisConfigClient } from 'redis-smq-common';
import {
  createRedisClient,
  TRedisClientAsync,
} from '../helpers/redis-client.js';

/**
 * E2E lifecycle. One Redis and one API per test file.
 *
 *   beforeAll  → spawn Redis, boot API
 *   beforeEach → flush Redis, re-apply the library config
 *   afterAll   → stop API, stop Redis
 */

let redis: RedisInstance | null;
let api: ApiInstance | null;
let redisClient: TRedisClientAsync | null;

beforeAll(async () => {
  redis = await spawnRedis();
  redisClient = await createRedisClient(redis.port);

  // Seed the library config before the API boots. The API's
  // `bootstrap()` initializes RedisSMQ against the same Redis, so a
  // config written here is visible to it.
  await RedisSMQ.initialize({
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: redis.port },
  });
  await RedisSMQ.createConfigManager().updateConfig(TEST_REDIS_SMQ_CONFIG);
  await RedisSMQ.shutdown();

  api = await startApi({
    redisPort: redis.port,
  });
  setContext(api, redis, redisClient);
});

beforeEach(async () => {
  if (!redis) throw new Error('Redis not started.');
  if (!redisClient) throw new Error('Redis client not initialized.');

  // Flush clears the keyspace. Scripts survive, so the running
  // runtime's cached SHAs remain valid — no NOSCRIPT.
  await redisClient.flushallAsync();

  // Re-apply the library config, because the flush removed it. The
  // API is running and holds the RedisSMQ runtime, so we go through
  // the same public API the server uses.
  await RedisSMQ.createConfigManager().updateConfig(TEST_REDIS_SMQ_CONFIG);

  // Process-wide defaults are not persisted in Redis; reapply so a
  // test that changes them can't leak into its successors.
  RedisSMQ.setDefaultMessageConsumeOptions({
    ttl: 0,
    retryThreshold: 3,
    retryDelay: 0,
    consumeTimeout: 0,
  });
  RedisSMQ.setDefaultConsumerOptions({
    heartbeatTTL: 3_000,
    batchAcks: { enabled: true, batchSize: 100, batchTimeoutMs: 1000 },
    batchUnacks: { enabled: true, batchSize: 100, batchTimeoutMs: 1000 },
  });
});

afterAll(async () => {
  if (api) {
    await api.shutdown();
    api = null;
  }

  if (redisClient) {
    await redisClient.shutdownAsync();
  }

  if (redis) {
    await redis.shutdown();
    redis = null;
  }

  clearContext();
});
