import esmock from 'esmock';
import { expect, it, vi } from 'vitest';
import * as redisServerUtils from '../../src/redis-server/index.js';
import { depPath, mockChildProcess, modPath } from './common.js';

it('should start Redis server with default port if no port is provided', async () => {
  const getRandomPortMock = vi.fn().mockResolvedValue(6379);
  const { redisServer } = await esmock<typeof redisServerUtils>(
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
  const redisServerPort = await redisServer.startRedisServer();
  expect(redisServerPort).toBe(expectedPort);
  expect(getRandomPortMock).toHaveBeenCalledTimes(1);
  await redisServer.shutdownRedisServer(redisServerPort);
});
