/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { ApiInstance } from './start-api.js';
import type { RedisInstance } from './redis-server.js';
import type { TRedisClientAsync } from './redis-client.js';

interface TestContext {
  api: ApiInstance;
  redis: RedisInstance;
  redisClient: TRedisClientAsync;
}

let context: TestContext | null = null;

export function setContext(
  api: ApiInstance,
  redis: RedisInstance,
  redisClient: TRedisClientAsync,
): void {
  context = { api, redis, redisClient };
}

export function clearContext(): void {
  context = null;
}

export function apiUrl(): string {
  if (!context) {
    throw new Error(
      'Test context has not been initialized. Check vitest.setup.ts.',
    );
  }
  return context.api.url;
}

export function apiInstance(): ApiInstance['api'] {
  if (!context) {
    throw new Error(
      'Test context has not been initialized. Check vitest.setup.ts.',
    );
  }
  return context.api.api;
}

/**
 * Raw Redis client, connected to the embedded Redis the API is using.
 *
 * Returned as a `RedisClient` — the same shape everywhere it appears,
 * regardless of what any given test does with it. A test that wants
 * to `FLUSHALL` calls `.flushall()`; one that wants to read a key
 * calls `.get(...)`; one that wants to seed state calls `.set(...)`.
 * The name doesn't promise a purpose.
 */
export function redisClient(): TRedisClientAsync {
  if (!context) {
    throw new Error(
      'Test context has not been initialized. Check vitest.setup.ts.',
    );
  }
  return context.redisClient;
}
