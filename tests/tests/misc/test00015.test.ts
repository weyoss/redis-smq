import { delay, promisifyAll } from 'bluebird';
import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { RequeueWorker } from '../../../src/workers/requeue.worker';
import { WatchdogWorker } from '../../../src/workers/watchdog.worker';
import { getMessageManager } from '../../common/message-manager';
import { untilConsumerEvent } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getRedisInstance } from '../../common/redis';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { requiredConfig } from '../../common/config';
import { logger } from '../../common/logger';

test('HeartbeatMonitorWorker -> RequeueWorker', async () => {
  await createQueue(defaultQueue, false);

  let message: Message | null = null;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg) => {
      message = msg;
      consumer.shutdown();
    }),
  });

  const producer = getProducer();
  await producer.produceAsync(
    new Message()
      .setRetryDelay(0)
      .setBody('message body')
      .setQueue(defaultQueue),
  );

  consumer.run();
  await untilConsumerEvent(consumer, events.DOWN);
  await consumer.shutdownAsync();
  expect(message !== null).toBe(true);

  const redisClient = await getRedisInstance();

  // should move message from processing queue to delay queue
  const watchdogWorker = promisifyAll(
    new WatchdogWorker(redisClient, requiredConfig, false, logger),
  );
  watchdogWorker.run();
  await delay(5000);

  // should move from delay queue to scheduled queue
  const requeueWorker = promisifyAll(new RequeueWorker(redisClient, false));
  requeueWorker.run();
  await delay(5000);

  const messageManager = await getMessageManager();
  const res3 = await messageManager.pendingMessages.listAsync(
    defaultQueue,
    0,
    99,
  );
  expect(res3.total).toBe(1);

  await requeueWorker.quitAsync();
  await watchdogWorker.quitAsync();
});
