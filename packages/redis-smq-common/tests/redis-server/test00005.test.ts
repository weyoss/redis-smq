import esmock from 'esmock';
import { expect, it, vi } from 'vitest';
import * as redisServerUtils from '../../src/redis-server/index.js';
import { depPath, mockChildProcess, modPath } from './common.js';

it('should reject with a timeout error when Redis server does not start within 10 seconds', async () => {
  const { redisServer } = await esmock<typeof redisServerUtils>(
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
  await expect(redisServer.startRedisServer()).rejects.toThrow(
    'Redis server start timeout',
  );
});
