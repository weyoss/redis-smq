import { delay, promisifyAll } from 'bluebird';
import { WatchConsumersWorker } from '../../../src/workers/watch-consumers.worker';
import { getRedisInstance } from '../../common/redis';
import {
  createQueue,
  defaultQueue,
  crashAConsumerConsumingAMessage,
} from '../../common/message-producing-consuming';
import { logger } from '../../common/logger';
import RequeueUnacknowledgedWorker from '../../../src/workers/requeue-unacknowledged.worker';
import { getQueuePendingMessages } from '../../common/queue-pending-messages';

test('WatchdogWorker', async () => {
  await createQueue(defaultQueue, false);
  await crashAConsumerConsumingAMessage();

  const redisClient = await getRedisInstance();
  const watchdogWorker = promisifyAll(
    new WatchConsumersWorker(redisClient, false, logger),
  );
  watchdogWorker.run();

  const redisClient2 = await getRedisInstance();
  const requeueWorker = promisifyAll(
    new RequeueUnacknowledgedWorker(redisClient2, false),
  );
  requeueWorker.run();

  await delay(20000);

  const pendingMessages = await getQueuePendingMessages();
  const res3 = await pendingMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res3.totalItems).toBe(1);

  await watchdogWorker.quitAsync();
  await requeueWorker.quitAsync();
});
