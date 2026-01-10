import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import bluebird from 'bluebird';
import { EWorkerMessageType, IWorkerData } from '../src/types/index.js';
import {
  env,
  ERedisConfigClient,
  IRedisConfig,
  RedisServer,
} from 'redis-smq-common';
import {
  EQueueDeliveryModel,
  EQueueType,
  IQueueParams,
  RedisSMQ,
} from 'redis-smq';
import { mockWorkerThread } from './mock-worker-thread.js';
import path from 'node:path';

const RedisSMQAsync = bluebird.promisifyAll(RedisSMQ);
const currentDir = env.getCurrentDir();

describe('producer-worker-thread.ts', () => {
  let workerData: IWorkerData;
  let redisServer: RedisServer;
  let redisConfig: IRedisConfig;
  const queue: IQueueParams = { ns: 'test', name: 'test-queue' };

  beforeAll(async () => {
    redisServer = new RedisServer();
    const redisPort = await redisServer.start();
    redisConfig = {
      client: ERedisConfigClient.IOREDIS,
      options: {
        host: '127.0.0.1',
        port: redisPort,
        db: 0,
      },
    };

    await RedisSMQAsync.initializeWithConfigAsync({
      redis: redisConfig,
    });

    const qm = bluebird.promisifyAll(RedisSMQAsync.createQueueManager());
    await qm.saveAsync(
      queue,
      EQueueType.FIFO_QUEUE,
      EQueueDeliveryModel.POINT_TO_POINT,
    );
  });

  afterAll(async () => {
    await RedisSMQAsync.shutdownAsync();
    await redisServer.shutdown();
  });

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Setup mock worker data
    workerData = {
      queue,
      redisConfig: redisConfig,
      workerId: 1,
      expectedMessages: 100,
    };
  });

  it('should produce messages and send completion message', async () => {
    const workerPath = path.resolve(
      currentDir,
      '../src/threads/producer-worker-thread.js',
    );
    const { parentPort } = await mockWorkerThread(workerPath, workerData);

    // Wait for messages to be processed
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify completion message was sent
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: EWorkerMessageType.COMPLETED,
        data: expect.objectContaining({
          workerId: 1,
          processed: 100,
        }),
      }),
    );
  });
});
