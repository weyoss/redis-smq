/*
 * packages/redis-smq-common/tests/setup/vitest.setup.ts
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
  vi.resetModules();
});

afterEach(async () => {
  await shutdown();
});
