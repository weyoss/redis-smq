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
import bluebird from 'bluebird';
import { RedisSMQ } from 'redis-smq';
import { config } from './common/config.js';
import { shutdownWebServer } from './common/start-web-server.js';
import { shutdownApiServer } from './common/start-api-server.js';

const RedisSMQAsync = bluebird.promisifyAll(RedisSMQ);

beforeAll(async () => {
  await initializeRedis();
});

afterAll(async () => {
  await shutDownRedisServer();
});

beforeEach(async () => {
  const redis = await getRedisClientInstance();
  await redis.flushallAsync();
  await RedisSMQAsync.initializeWithConfigAsync(config);
  await RedisSMQAsync.shutdownAsync();
});

afterEach(async () => {
  await shutdownWebServer();
  await shutdownApiServer();
  await shutdownRedisClient();
});
