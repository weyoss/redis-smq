/*
 * packages/redis-smq-web-server/tests/setup/vitest.setup.ts
 */

import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import {
  initializeRedis,
  shutDownRedisServer,
} from '../helpers/start-redis-server.js';
import {
  getRedisClientInstance,
  shutdownRedisClient,
} from '../helpers/redis-client.js';
import { shutdownWebServer } from '../helpers/start-web-server.js';
import { shutdownApiServer } from '../helpers/start-api-server.js';

beforeAll(async () => {
  await initializeRedis();
});

afterAll(async () => {
  await shutDownRedisServer();
});

beforeEach(async () => {
  const redis = await getRedisClientInstance();
  await redis.flushallAsync();
});

afterEach(async () => {
  await shutdownWebServer();
  await shutdownApiServer();
  await shutdownRedisClient();
});
