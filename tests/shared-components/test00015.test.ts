import {
  defaultQueue,
  getConsumer,
  getMessageManager,
  getProducer,
  getRedisInstance,
  untilConsumerEvent,
} from '../common';
import { delay, promisifyAll } from 'bluebird';
import { Message } from '../../src/system/message/message';
import { events } from '../../src/system/common/events';
import { GCWorker } from '../../src/system/workers/gc.worker';
import { RequeueWorker } from '../../src/system/workers/requeue.worker';

test('GCWorker -> RequeueWorker', async () => {
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
  const gcWorker = promisifyAll(new GCWorker(redisClient, 'abc'));
  gcWorker.run();
  await delay(5000);

  // should move from delay queue to scheduled queue
  const requeueWorker = promisifyAll(new RequeueWorker(redisClient));
  requeueWorker.run();
  await delay(5000);

  const messageManager = promisifyAll(await getMessageManager());
  const res3 = await messageManager.getPendingMessagesAsync(
    defaultQueue,
    0,
    99,
  );
  expect(res3.total).toBe(1);

  await requeueWorker.quitAsync();
  await gcWorker.quitAsync();
});
