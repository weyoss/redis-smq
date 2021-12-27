import {
  getConsumer,
  getMessageManagerFrontend,
  getProducer,
  getQueueManagerFrontend,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Combined test: Requeue a message from dead-letter queue with priority.  Check both pending and acknowledged messages. Check queue metrics.', async () => {
  const producer = getProducer();
  const queue = producer.getQueue();

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const consumer = getConsumer({
    consumeMock: (m, cb) => {
      throw new Error();
    },
  });
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManagerFrontend());
  await messageManager.requeueMessageFromDLQueueAsync(
    queue,
    0,
    msg.getId(),
    true,
    undefined,
  );

  const res1 = await messageManager.getPendingMessagesAsync(queue, 0, 100);
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.getPendingMessagesWithPriorityAsync(
    queue,
    0,
    100,
  );
  expect(res2.total).toBe(1);
  expect(res2.items.length).toBe(1);
  expect(res2.items[0].getId()).toEqual(msg.getId());
  expect(res2.items[0].getPriority()).toEqual(Message.MessagePriority.NORMAL);

  const res3 = await messageManager.getDeadLetterMessagesAsync(queue, 0, 100);
  expect(res3.total).toBe(0);
  expect(res3.items.length).toBe(0);

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.deadLettered).toBe(0);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.pendingWithPriority).toBe(1);
});
