/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import {
  initializeRedis,
  shutDownRedisServer,
} from './common/start-redis-server.js';
import {
  getRedisClientInstance,
  shutdownRedisClient,
} from './common/redis-client.js';
import { shutdownWebServer } from './common/start-web-server.js';
import { shutdownApiServer } from './common/start-api-server.js';

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
