/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import type { WebServerInstance } from './start-web-server.js';
import { getCurrentRedisPort, RedisInstance } from './redis-server.js';
import type { TRedisClientAsync } from './redis-client.js';

interface TestContext {
  webServer: WebServerInstance;
  redis: RedisInstance;
  redisClient: TRedisClientAsync;
}

let context: TestContext | null = null;

export function setContext(
  webServer: WebServerInstance,
  redis: RedisInstance,
  redisClient: TRedisClientAsync,
): void {
  context = { webServer, redis, redisClient };
}

export function clearContext(): void {
  context = null;
}

export function webServerUrl(): string {
  if (!context) {
    throw new Error(
      'Test context has not been initialized. Check vitest.setup.ts.',
    );
  }
  return context.webServer.url;
}

export function getRedisPort(): number {
  return getCurrentRedisPort();
}

export function redisClient(): TRedisClientAsync {
  if (!context) {
    throw new Error(
      'Test context has not been initialized. Check vitest.setup.ts.',
    );
  }
  return context.redisClient;
}
