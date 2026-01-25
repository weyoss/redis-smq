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
import * as redisServerUtils from '../../src/redis-server/index.js';
import { depPath, mockChildProcess, modPath } from './common.js';

it('should throw an error when starting a Redis server on an already occupied port', async () => {
  const port = 6379;
  const { RedisServer } = await esmock<typeof redisServerUtils>(
    modPath,
    {},
    {
      [depPath]: {
        net: {
          getRandomPort: vi.fn().mockResolvedValue(6379),
        },
      },
      child_process: mockChildProcess(),
    },
  );
  const redisServer = new RedisServer();
  await redisServer.start(port);
  await expect(redisServer.start()).rejects.toThrow(
    new Error(`Already started or going up`),
  );
  await redisServer.shutdown();
});
