import {
  getConsumer,
  getMessageManagerFrontend,
  getProducer,
  getQueueManagerFrontend,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Combined test: Delete an acknowledged message. Check pending, acknowledged, and dead-letter messages. Check queue metrics.', async () => {
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const producer = getProducer();
  await producer.produceMessageAsync(msg);
  const queue = producer.getQueue();

  const consumer = getConsumer({
    consumeMock: (m, cb) => {
      cb();
    },
  });
  await consumer.runAsync();
  await untilConsumerIdle(consumer);

  const messageManager = promisifyAll(await getMessageManagerFrontend());

  const res0 = await messageManager.getDeadLetterMessagesAsync(queue, 0, 100);
  expect(res0.total).toBe(0);
  expect(res0.items.length).toBe(0);

  const res1 = await messageManager.getPendingMessagesAsync(queue, 0, 100);
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.getAcknowledgedMessagesAsync(queue, 0, 100);
  expect(res2.total).toBe(1);
  expect(res2.items.length).toBe(1);
  expect(res2.items[0].message).toEqual(msg);

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(1);

  await messageManager.deleteAcknowledgedMessageAsync(queue, 0, msg.getId());

  const res3 = await messageManager.getAcknowledgedMessagesAsync(queue, 0, 100);
  expect(res3.total).toBe(0);
  expect(res3.items.length).toBe(0);

  const res4 = await messageManager.getPendingMessagesAsync(queue, 0, 100);
  expect(res4.total).toBe(0);
  expect(res4.items.length).toBe(0);

  const res5 = await messageManager.getPendingMessagesWithPriorityAsync(
    queue,
    0,
    100,
  );
  expect(res5.total).toBe(0);
  expect(res5.items.length).toBe(0);

  const res6 = await messageManager.getDeadLetterMessagesAsync(queue, 0, 100);
  expect(res6.total).toBe(0);
  expect(res6.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics1.acknowledged).toBe(0);

  await expect(async () => {
    await messageManager.deleteAcknowledgedMessageAsync(queue, 0, msg.getId());
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
