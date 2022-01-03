import {
  getConsumer,
  getMessageManagerFrontend,
  getProducer,
  getQueueManagerFrontend,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Combined test: Dead-letter a message and requeue it. Check pending, acknowledged, pending messages, and queue metrics.', async () => {
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const producer = getProducer();
  await producer.produceAsync(msg);
  const queue = producer.getQueue();

  const consumer = getConsumer({
    consumeMock: (m, cb) => {
      throw new Error();
    },
  });
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManagerFrontend());
  const res1 = await messageManager.getPendingMessagesAsync(queue, 0, 100);
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.getAcknowledgedMessagesAsync(queue, 0, 100);
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const res3 = await messageManager.getDeadLetterMessagesAsync(queue, 0, 100);
  expect(res3.total).toBe(1);
  expect(res3.items.length).toBe(1);
  expect(res3.items[0].message.getId()).toEqual(msg.getId());
  expect(res3.items[0].message.getAttempts()).toEqual(2);

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(0);
  expect(queueMetrics.deadLettered).toBe(1);

  await messageManager.requeueMessageFromDLQueueAsync(
    queue,
    0,
    msg.getId(),
    undefined,
  );

  const res5 = await messageManager.getPendingMessagesAsync(queue, 0, 100);

  expect(res5.total).toBe(1);
  expect(res5.items.length).toBe(1);
  expect(res5.items[0].message.getId()).toEqual(msg.getId());
  expect(res5.items[0].message.getAttempts()).toEqual(0);

  const res6 = await messageManager.getDeadLetterMessagesAsync(queue, 0, 100);
  expect(res6.total).toBe(0);
  expect(res6.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics1.deadLettered).toBe(0);
  expect(queueMetrics1.pending).toBe(1);

  await expect(async () => {
    await messageManager.requeueMessageFromDLQueueAsync(
      queue,
      0,
      msg.getId(),
      undefined,
    );
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
