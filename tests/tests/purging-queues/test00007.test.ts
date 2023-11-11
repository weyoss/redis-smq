import { IQueueParams } from '../../../types';
import { processingQueue } from '../../../src/lib/consumer/message-handler/processing-queue';
import { RedisClient, ICallback } from 'redis-smq-common';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getConsumer } from '../../common/consumer';
import { getQueue } from '../../common/queue';
import { WatchedKeysChangedError } from 'redis-smq-common/dist/src/redis-client/errors/watched-keys-changed.error';

test('Concurrently deleting a message queue and starting a consumer', async () => {
  await createQueue(defaultQueue, false);
  const consumer = getConsumer();

  // queueInstance.delete() calls processingQueue.getQueueProcessingQueues() after validation is passed.
  // Within getQueueProcessingQueues() method, we can take more time than usual to return a response, to allow the
  // consumer to start up. queueManagerInstance.delete() should detect that a consumer has been started and
  // the operation should be cancelled.
  const originalMethod = processingQueue.getQueueProcessingQueues;
  processingQueue.getQueueProcessingQueues = (
    ...args: [
      redisClient: RedisClient,
      queue: IQueueParams,
      cb: ICallback<Record<string, string>>,
    ]
  ): void => {
    setTimeout(() => {
      originalMethod(...args);
    }, 5000);
  };

  const q = await getQueue();

  await expect(async () => {
    await Promise.all([q.deleteAsync(defaultQueue), consumer.runAsync()]);
  }).rejects.toThrow(WatchedKeysChangedError);

  // restore
  processingQueue.getQueueProcessingQueues = originalMethod;
});
