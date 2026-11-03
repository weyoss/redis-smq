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

it('uses getRandomPort() when start() is called without an explicit port', async () => {
  const getRandomPort = vi.fn().mockResolvedValue(6379);

  const { RedisServer } = await esmock<typeof redisServerUtils>(
    modPath,
    {},
    {
      [depPath]: { net: { getRandomPort } },
      child_process: mockChildProcess({ startServerTimeout: 20 }),
    },
  );

  const server = new RedisServer();
  const port = await server.start();

  expect(port).toBe(6379);
  expect(getRandomPort).toHaveBeenCalledTimes(1);

  await server.shutdown();
});
