/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQ } from 'redis-smq';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { TEST_REDIS_SMQ_CONFIG } from '../helpers/config.js';
import { clearContext, setContext } from '../helpers/context.js';
import {
  createRedisClient,
  type TRedisClientAsync,
} from '../helpers/redis-client.js';
import { type RedisInstance, spawnRedis } from '../helpers/redis-server.js';
import {
  startWebServer,
  type WebServerInstance,
} from '../helpers/start-web-server.js';
import { ERedisConfigClient } from 'redis-smq-common';

/**
 * E2E lifecycle for the web server test suite.
 *
 *   beforeAll  → spawn Redis, open a flush client (once per file)
 *   beforeEach → flush Redis, seed library config, start the web server
 *   afterEach  → stop the web server (per test)
 *   afterAll   → close the flush client, stop Redis (once per file)
 */

let redis: RedisInstance | null = null;
let redisClient: TRedisClientAsync | null = null;
let webServer: WebServerInstance | null = null;

beforeAll(async () => {
  redis = await spawnRedis();
  redisClient = await createRedisClient(redis.port);
});

beforeEach(async () => {
  if (!redis) throw new Error('Redis not started.');
  if (!redisClient) throw new Error('Redis client not initialized.');

  // 1. Wipe the keyspace. Script cache survives — no NOSCRIPT.
  await redisClient.flushallAsync();

  // 2. Persist the suite's library config. Requires a running runtime,
  //    so spin one up, write, tear it down. The runtime created here
  //    is separate from the one the web server's embedded REST API
  //    will build below.
  await RedisSMQ.initialize({
    client: ERedisConfigClient.IOREDIS,
    options: { host: '127.0.0.1', port: redis.port },
  });
  await RedisSMQ.createConfigManager().updateConfig(TEST_REDIS_SMQ_CONFIG);
  await RedisSMQ.shutdown();

  // 3. Process-wide library defaults. Not persisted; applied fresh
  //    each test so a test that changes them can't leak into its
  //    successors. These are only consulted by consumer/producer
  //    creation — the web server's tests rarely create either, but
  //    the app tests below this one might.
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

  // 4. Start the web server. Its bootstrap() loads the Web UI bundle,
  //    starts the embedded REST API (which reads the config written in
  //    step 2), and composes the Express app. Every manager the
  //    embedded API creates is fresh for this test.
  webServer = await startWebServer({ redisPort: redis.port });
  setContext(webServer, redis, redisClient);
});

afterEach(async () => {
  // Stop the web server first. Its shutdown closes the HTTP listener,
  // then disposes the embedded REST API (which calls
  // `RedisSMQ.shutdown()` internally). Once that returns, the runtime
  // is gone.
  if (webServer) {
    await webServer.shutdown();
    webServer = null;
  }

  // Belt and braces: if a test created a runtime outside the web
  // server (a helper that called `RedisSMQ.startProducer()` without
  // shutting it down, for instance), this disposes it too.
  // `RedisSMQ.shutdown()` is idempotent.
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
