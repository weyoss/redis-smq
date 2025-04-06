import esmock from 'esmock';
import { expect, it, vi } from 'vitest';
import * as redisServerUtils from '../../src/redis-server/index.js';
import { depPath, mockChildProcess, modPath } from './common.js';

it('should reject with a timeout error when Redis server does not start within 10 seconds', async () => {
  const { RedisServer } = await esmock<typeof redisServerUtils>(
    modPath,
    {},
    {
      [depPath]: {
        net: {
          getRandomPort: vi.fn().mockResolvedValue(6379),
        },
      },
      child_process: mockChildProcess({ startServerTimeout: 15000 }),
    },
  );
  const redisServer = new RedisServer();
  await expect(redisServer.start()).rejects.toThrow(
    'Redis server start timeout',
  );
});
