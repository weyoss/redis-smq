import { getConsumer, getRedisInstance, produceMessage } from '../common';
import { promisifyAll } from 'bluebird';
import { QueueManager } from '../../src/queue-manager';
import { queueManager } from '../../src/system/app/queue-manager/queue-manager';
import { RedisClient } from '../../src/system/common/redis-client/redis-client';
import { ICallback, TQueueParams } from '../../types';

test('Concurrently deleting a message queue and starting a consumer', async () => {
  const { queue } = await produceMessage();

  const redisClient1 = await getRedisInstance();
  const queueManagerInstance = promisifyAll(new QueueManager(redisClient1));

  const consumer = getConsumer();

  const m1 = await queueManagerInstance.getQueueMetricsAsync(queue);
  expect(m1).toEqual({
    acknowledged: 0,
    pendingWithPriority: 0,
    deadLettered: 0,
    pending: 1,
  });

  // queueManagerInstance.deleteMessageQueue() calls queueManager.getQueueProcessingQueues() after validation is passed.
  // Within getQueueProcessingQueues() method, we can take more time than usual to return a response, to allow the
  // consumer to start up. queueManagerInstance.deleteMessageQueue() should detect that a consumer has been started and
  // the operation should be cancelled.
  const originalMethod = queueManager.getQueueProcessingQueues;
  queueManager.getQueueProcessingQueues = (
    ...args: [
      redisClient: RedisClient,
      queue: TQueueParams,
      cb: ICallback<Record<string, string>>,
    ]
  ): void => {
    setTimeout(() => {
      originalMethod(...args);
    }, 5000);
  };

  await expect(async () => {
    await Promise.all([
      queueManagerInstance.deleteMessageQueueAsync(queue),
      consumer.runAsync(),
    ]);
  }).rejects.toThrow('Redis transaction has been abandoned. Try again.');

  const m2 = await queueManagerInstance.getQueueMetricsAsync(queue);
  expect(m2).toEqual({
    acknowledged: 1,
    pendingWithPriority: 0,
    deadLettered: 0,
    pending: 0,
  });

  // restore
  queueManager.getQueueProcessingQueues = originalMethod;
});
