import esmock from 'esmock';
import { expect, it, vi } from 'vitest';
import * as redisServerUtils from '../../src/redis-server/index.js';
import { depPath, mockChildProcess, modPath } from './common.js';

it('should throw an error when starting a Redis server on an already occupied port', async () => {
  const port = 6379;
  const { redisServer } = await esmock<typeof redisServerUtils>(
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
  await redisServer.startRedisServer(port);
  await expect(redisServer.startRedisServer()).rejects.toThrow(
    new Error(`Redis server is already running on port ${port}.`),
  );
  await redisServer.shutdownRedisServer(port);
});
