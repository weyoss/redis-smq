import { delay, promisifyAll } from 'bluebird';
import { WatchdogWorker } from '../../../src/workers/watchdog.worker';
import { getMessageManager } from '../../common/message-manager';
import { getRedisInstance } from '../../common/redis';
import {
  createQueue,
  defaultQueue,
  crashAConsumerConsumingAMessage,
} from '../../common/message-producing-consuming';
import { requiredConfig } from '../../common/config';
import { logger } from '../../common/logger';
import RequeueWorker from '../../../src/workers/requeue.worker';

test('WatchdogWorker', async () => {
  await createQueue(defaultQueue, false);
  await crashAConsumerConsumingAMessage();

  const redisClient = await getRedisInstance();
  const watchdogWorker = promisifyAll(
    new WatchdogWorker(redisClient, requiredConfig, false, logger),
  );
  watchdogWorker.run();

  const redisClient2 = await getRedisInstance();
  const requeueWorker = promisifyAll(new RequeueWorker(redisClient2, false));
  requeueWorker.run();

  await delay(20000);

  const messageManager = await getMessageManager();
  const res3 = await messageManager.pendingMessages.listAsync(
    defaultQueue,
    0,
    99,
  );
  expect(res3.total).toBe(1);

  await watchdogWorker.quitAsync();
  await requeueWorker.quitAsync();
});
