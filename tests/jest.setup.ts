import { getRedisInstance, shutdown } from './common';

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T;

let redisInstance: ThenArg<ReturnType<typeof getRedisInstance>> | null = null;

beforeAll(async () => {
  if (!redisInstance) {
    redisInstance = getRedisInstance();
  }
});

afterAll(async () => {
  if (redisInstance) {
    redisInstance.end(true);
    redisInstance = null;
  }
});

beforeEach(async () => {
  await redisInstance?.flushallAsync();
});

afterEach(async () => {
  await shutdown();
});

jest.setTimeout(160000);
