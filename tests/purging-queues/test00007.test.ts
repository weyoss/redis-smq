import {
  createQueue,
  defaultQueue,
  getConsumer,
  getQueueManager,
  produceMessage,
} from '../common';
import { RedisClient } from '../../src/system/common/redis-client/redis-client';
import { ICallback, TQueueParams } from '../../types';
import { processingQueue } from '../../src/system/app/consumer/consumer-message-handler/processing-queue';

test('Concurrently deleting a message queue and starting a consumer', async () => {
  await createQueue(defaultQueue, false);
  const { queue } = await produceMessage();

  const queueManager = await getQueueManager();

  const consumer = getConsumer();

  const m1 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m1).toEqual({
    acknowledged: 0,
    deadLettered: 0,
    pending: 1,
  });

  // queueManagerInstance.deleteQueue() calls queueManager.getQueueProcessingQueues() after validation is passed.
  // Within getQueueProcessingQueues() method, we can take more time than usual to return a response, to allow the
  // consumer to start up. queueManagerInstance.deleteQueue() should detect that a consumer has been started and
  // the operation should be cancelled.
  const originalMethod = processingQueue.getQueueProcessingQueues;
  processingQueue.getQueueProcessingQueues = (
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
      queueManager.queue.deleteQueueAsync(queue),
      consumer.runAsync(),
    ]);
  }).rejects.toThrow('Redis transaction has been abandoned. Try again.');

  const m2 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m2).toEqual({
    acknowledged: 1,
    deadLettered: 0,
    pending: 0,
  });

  // restore
  processingQueue.getQueueProcessingQueues = originalMethod;
});
