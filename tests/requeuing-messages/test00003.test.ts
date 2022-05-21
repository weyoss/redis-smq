import {
  defaultQueue,
  getConsumer,
  getMessageManager,
  getProducer,
  getQueueManager,
  untilMessageAcknowledged,
} from '../common';
import { Message } from '../..';

test('Combined test. Requeue a priority message from acknowledged queue. Check queue metrics.', async () => {
  const queueManager = await getQueueManager();
  await queueManager.queue.createAsync(defaultQueue, true);

  const consumer = getConsumer({
    queue: defaultQueue,
    messageHandler: jest.fn((msg, cb) => {
      setTimeout(cb, 5000);
    }),
  });

  const message = new Message();
  message
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue)
    .setPriority(Message.MessagePriority.ABOVE_NORMAL);

  const producer = getProducer();
  await producer.produceAsync(message);

  consumer.run();
  await untilMessageAcknowledged(consumer);

  const messageManager = await getMessageManager();
  const res2 = await messageManager.acknowledgedMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res2.total).toBe(1);
  expect(res2.items.length).toBe(1);

  const queueMetrics = await queueManager.queueMetrics.getMetricsAsync(
    defaultQueue,
  );
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(1);

  await messageManager.acknowledgedMessages.requeueAsync(
    defaultQueue,
    message.getRequiredId(),
    0,
  );

  const res6 = await messageManager.acknowledgedMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res6.total).toBe(0);
  expect(res6.items.length).toBe(0);

  const res7 = await messageManager.pendingMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(res7.total).toBe(1);
  expect(res7.items.length).toBe(1);
  expect(res7.items[0].message.getId()).toEqual(message.getRequiredId());

  await expect(async () => {
    await messageManager.acknowledgedMessages.requeueAsync(
      defaultQueue,
      message.getRequiredId(),
      0,
    );
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
