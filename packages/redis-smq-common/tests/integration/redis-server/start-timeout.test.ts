/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import esmock from 'esmock';
import { afterEach, beforeEach, expect, it, vi, describe } from 'vitest';
import * as redisServerUtils from '../../../src/redis-server/index.js';
import { depPath, mockChildProcess, modPath } from './common.js';

describe('RedisServer: start timeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('rejects when the server never signals readiness within the timeout', async () => {
    const { RedisServer } = await esmock<typeof redisServerUtils>(
      modPath,
      {},
      {
        [depPath]: {
          net: { getRandomPort: vi.fn().mockResolvedValue(6379) },
        },
        // Never fires readiness — the source's own timeout must win.
        child_process: mockChildProcess({ startServerTimeout: Infinity }),
      },
    );

    const server = new RedisServer();
    const caught = server.start().catch((e: unknown) => e);

    // Flush microtasks so the source's timeout is scheduled.
    await vi.advanceTimersByTimeAsync(0);
    // Advance past the 10 s start timeout.
    await vi.advanceTimersByTimeAsync(10_100);

    const error = await caught;
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toContain('Redis server start timeout');
  });
});
