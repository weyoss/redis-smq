/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import esmock from 'esmock';
import { expect, it, vi } from 'vitest';
import * as redisServerUtils from '../../../src/redis-server/index.js';
import { depPath, mockChildProcess, modPath } from './common.js';

it('rejects a second start() on the same instance', async () => {
  const { RedisServer } = await esmock<typeof redisServerUtils>(
    modPath,
    {},
    {
      [depPath]: { net: { getRandomPort: vi.fn().mockResolvedValue(6379) } },
      child_process: mockChildProcess({ startServerTimeout: 20 }),
    },
  );

  const server = new RedisServer();
  await server.start(6379);

  await expect(server.start()).rejects.toThrow('Already started or going up');

  await server.shutdown();
});
