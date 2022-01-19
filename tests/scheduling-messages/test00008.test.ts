import {
  getConsumer,
  getMessageManager,
  getProducer,
  getQueueManagerFrontend,
} from '../common';
import { Message } from '../../src/message';
import { delay, promisifyAll } from 'bluebird';

test("Make sure scheduled messages aren't published if destination queue is deleted", async () => {
  const msg = new Message();
  msg
    .setScheduledCron('*/3 * * * * *')
    .setBody({ hello: 'world' })
    .setQueue('some_queue');

  const producer = getProducer();
  const r = await producer.produceAsync(msg);
  expect(r).toBe(true);

  const consumer = getConsumer();
  await consumer.runAsync();

  const messageManager = promisifyAll(await getMessageManager());
  const s1 = await messageManager.getScheduledMessagesAsync(0, 99);
  expect(s1.total).toBe(1);

  await delay(10000);
  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const m1 = await queueManager.getQueueMetricsAsync('some_queue');
  expect(m1.pending > 0).toBe(true);

  await producer.shutdownAsync();
  await queueManager.deleteMessageQueueAsync('some_queue');

  await delay(10000);
  const m2 = await queueManager.getQueueMetricsAsync('some_queue');
  expect(m2.pending).toBe(0);

  const s2 = await messageManager.getScheduledMessagesAsync(0, 99);
  expect(s2.total).toBe(0);
});
