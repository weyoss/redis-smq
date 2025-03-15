/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { shutdown, startUp } from './common.js';
import { initializeRedis, shutDownRedisServer } from './redis-server.js';

beforeAll(async () => {
  await initializeRedis();
});

afterAll(async () => {
  await shutDownRedisServer();
});

beforeEach(async () => {
  vi.resetAllMocks();
  await startUp();
  vi.resetModules();
});

afterEach(async () => {
  await shutdown();
});
