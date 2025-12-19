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
});

afterEach(async () => void 0);
