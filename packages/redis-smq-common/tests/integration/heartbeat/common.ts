/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { vi, type Mock } from 'vitest';
import { Heartbeat } from '../../../src/heartbeat/index.js';
import type { Backoff } from '../../../src/backoff/backoff.js';
import type { IRedisClient } from '../../../src/redis-client/index.js';

export interface MockRedisClient {
  get: Mock;
  mget: Mock;
  set: Mock;
  del: Mock;
}

export function mockRedisClient(
  overrides: Partial<MockRedisClient> = {},
): MockRedisClient {
  return {
    get: vi.fn(),
    mget: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    ...overrides,
  };
}

export function asClient(mock: MockRedisClient): IRedisClient {
  return mock as unknown as IRedisClient;
}

/**
 * Test double that exposes `Heartbeat`'s protected fields with typed
 * getters — no `as unknown as` casts anywhere. TypeScript's `protected`
 * modifier guarantees the getter can only exist on a subclass.
 */
export class TestableHeartbeat extends Heartbeat {
  getHeartbeatTTL(): number {
    return this.heartbeatTTL;
  }

  getHeartbeatInterval(): number {
    return this.heartbeatInterval;
  }

  getBackoff(): Backoff {
    return this.backoff;
  }
}

export async function waitFor(
  predicate: () => boolean,
  timeoutMs = 3000,
): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Condition not met within ${timeoutMs}ms`);
    }
    await new Promise((r) => setTimeout(r, 20));
  }
}
