import esmock from 'esmock';
import { expect, it, vi } from 'vitest';
import * as redisServerUtils from '../../src/redis-server/index.js';
import { depPath, mockChildProcess, modPath } from './common.js';

it('should throw an error when Redis binary is not found', async () => {
  const { redisServer } = await esmock<typeof redisServerUtils>(
    modPath,
    {},
    {
      [depPath]: {
        net: {
          getRandomPort: vi.fn(),
        },
      },
      child_process: mockChildProcess({ redisBinPath: '' }),
    },
  );
  await expect(redisServer.startRedisServer()).rejects.toThrow(
    'Redis binary not found.',
  );
});
