/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';
import { shutdown, startUp } from '../helpers/common.js';
import {
  initializeRedis,
  shutDownRedisServer,
} from '../helpers/redis-server.js';

beforeAll(async () => {
  await initializeRedis();
});

afterAll(async () => {
  await shutDownRedisServer();
});

beforeEach(async () => {
  vi.resetAllMocks();
  await startUp();
  // Order matters: reset modules AFTER startUp() so this setup's own
  // references (startUp/shutdown) stay in sync with the test file's
  // top-level imports. Fresh imports — especially from esmock and dynamic
  // imports — will see clean module state.
  vi.resetModules();
});

afterEach(async () => {
  await shutdown();
});
