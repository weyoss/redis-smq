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
import { DelayWorker } from '../../src/system/workers/delay.worker';
import { GCWorker } from '../../src/system/workers/gc.worker';
import { ScheduleWorker } from '../../src/system/workers/schedule.worker';

test('GCWorker -> DelayWorker -> ScheduleWorker', async () => {
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
      .setRetryDelay(10000)
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
  const delayHandler = promisifyAll(new DelayWorker(redisClient));
  delayHandler.run();
  await delay(5000);

  const messageManager = promisifyAll(await getMessageManager());
  const res = await messageManager.getScheduledMessagesAsync(0, 99);
  expect(res.total).toBe(1);

  // should move from delay queue to scheduled queue
  const scheduleWorker = promisifyAll(new ScheduleWorker(redisClient));
  scheduleWorker.run();
  await delay(15000);

  const res2 = await messageManager.getScheduledMessagesAsync(0, 99);
  expect(res2.total).toBe(0);

  const res3 = await messageManager.getPendingMessagesAsync(
    defaultQueue,
    0,
    99,
  );
  expect(res3.total).toBe(1);

  await delayHandler.quitAsync();
  await gcWorker.quitAsync();
  await scheduleWorker.quitAsync();
});
