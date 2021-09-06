import { getRedisInstance, shutdown } from './common';
import { TCompatibleRedisClient } from '../types';

let redisInstance: TCompatibleRedisClient | null = null;

beforeAll(async () => {
  if (!redisInstance) {
    redisInstance = await getRedisInstance();
  }
});

afterAll(async () => {
  if (redisInstance) {
    redisInstance.end(true);
    redisInstance = null;
  }
});

beforeEach(async () => {
  await redisInstance?.flushall();
});

afterEach(async () => {
  await shutdown();
});

jest.setTimeout(160000);
