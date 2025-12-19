/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterAll, afterEach, beforeAll, beforeEach, vitest } from 'vitest';
import { shutdown } from './common/shut-down.js';
import {
  initializeRedis,
  shutDownRedisServer,
} from './common/start-redis-server.js';
import { startUp } from './common/start-up.js';

beforeAll(async () => {
  await initializeRedis();
});

afterAll(async () => {
  await shutDownRedisServer();
});

beforeEach(async () => {
  vitest.resetAllMocks();
  vitest.resetModules();
  await startUp();
  vitest.resetModules();
});

afterEach(async () => {
  await shutdown();
});
