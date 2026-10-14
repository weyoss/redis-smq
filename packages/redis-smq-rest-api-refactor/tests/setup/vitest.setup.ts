/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ERedisConfigClient } from 'redis-smq-common';
import { RedisSMQ } from 'redis-smq';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { TEST_REDIS_SMQ_CONFIG } from '../helpers/config.js';
import { clearContext, setContext } from '../helpers/context.js';
import { type RedisInstance, spawnRedis } from '../helpers/redis-server.js';
import { type ApiInstance, startApi } from '../helpers/start-api.js';
import {
  createRedisClient,
  TRedisClientAsync,
} from '../helpers/redis-client.js';

/**
 * E2E lifecycle.
 *
 *   beforeAll  → spawn Redis, open a flush client (once per file)
 *   beforeEach → flush Redis, seed library config, boot the API (per test)
 *   afterEach  → stop the API (per test)
 *   afterAll   → close the flush client, stop Redis (once per file)
 */

let redis: RedisInstance | null = null;
let api: ApiInstance | null = null;
let redisClient: TRedisClientAsync | null = null;

beforeAll(async () => {
  redis = await spawnRedis();
  redisClient = await createRedisClient(redis.port);
});

beforeEach(async () => {
  if (!redis) throw new Error('Redis not started.');
  if (!redisClient) throw new Error('Redis client not initialized.');

  // 1. Wipe the keyspace. Script cache survives — no NOSCRIPT.
  await redisClient.flushallAsync();

  // 2. Persist the library config. Requires a running runtime, so
  //    spin one up, write, tear it down. The runtime created here is
  //    separate from the one `startApi` will build below.
  await RedisSMQ.initialize({
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: redis.port },
  });
  await RedisSMQ.createConfigManager().updateConfig(TEST_REDIS_SMQ_CONFIG);
  await RedisSMQ.shutdown();

  // 3. Process-wide defaults. Not persisted in Redis; applied fresh
  //    each test so a test that changes them can't leak into its
  //    successors.
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

  // 4. Boot the API. Its `bootstrap()` runs `RedisSMQ.initialize`,
  //    which reads the config written in step 2. Every manager the
  //    handlers reach — including the producer — is fresh for this
  //    test.
  api = await startApi({ redisPort: redis.port });
  setContext(api, redis, redisClient);

  // 5. Start the event bus. Some helpers await events published by
  //    the library's consumer path; without this, they hang.
  await RedisSMQ.getEventBus().run();
});

afterEach(async () => {
  // Stop the API first. Its `shutdown()` calls `RedisSMQ.shutdown()`
  // internally, disposing every manager the runtime created.
  if (api) {
    await api.shutdown();
    api = null;
  }

  // Belt and braces: if a test created a runtime outside the API
  // (a helper that called `RedisSMQ.startProducer()` without
  // shutting it down), this disposes it too. `RedisSMQ.shutdown()`
  // is idempotent.
  await RedisSMQ.shutdown();

  clearContext();
});

afterAll(async () => {
  if (redisClient) {
    await redisClient.shutdownAsync();
    redisClient = null;
  }
  if (redis) {
    await redis.shutdown();
    redis = null;
  }
});
