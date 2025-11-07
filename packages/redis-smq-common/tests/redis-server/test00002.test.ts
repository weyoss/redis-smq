/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import esmock from 'esmock';
import { expect, it, vi } from 'vitest';
import * as redisServerUtils from '../../src/redis-server/index.js';
import { depPath, mockChildProcess, modPath } from './common.js';

it('should start Redis server with default port if no port is provided', async () => {
  const getRandomPortMock = vi.fn().mockResolvedValue(6379);
  const { RedisServer } = await esmock<typeof redisServerUtils>(
    modPath,
    {},
    {
      [depPath]: {
        net: {
          getRandomPort: getRandomPortMock,
        },
      },
      child_process: mockChildProcess(),
    },
  );
  const expectedPort = 6379;
  const server = new RedisServer();
  const redisServerPort = await server.start();
  expect(redisServerPort).toBe(expectedPort);
  expect(getRandomPortMock).toHaveBeenCalledTimes(1);
  await server.shutdown();
});
