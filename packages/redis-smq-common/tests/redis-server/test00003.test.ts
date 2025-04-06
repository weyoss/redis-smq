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
    new Error(`Cannot start Redis server while it is already running.`),
  );
  await redisServer.shutdown();
});
