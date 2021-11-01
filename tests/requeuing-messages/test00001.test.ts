import {
  getConsumer,
  getMessageManager,
  getProducer,
  getQueueManager,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Combined test: Requeue a message from dead-letter queue with priority.  Check both pending and acknowledged messages. Check queue metrics.', async () => {
  const producer = getProducer();

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

  const messageManager = promisifyAll(await getMessageManager());
  await messageManager.requeueMessageFromDLQueueAsync(
    producer.getQueueName(),
    0,
    msg.getId(),
    true,
    undefined,
  );

  const res1 = await messageManager.getPendingMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.getPendingMessagesWithPriorityAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res2.total).toBe(1);
  expect(res2.items.length).toBe(1);
  // assign default consumer options
  const msg1 = Message.createFromMessage(msg).setPriority(
    Message.MessagePriority.NORMAL,
  );
  expect(res2.items[0].message).toEqual(msg1);

  const res3 = await messageManager.getDeadLetterMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );
  expect(res3.total).toBe(0);
  expect(res3.items.length).toBe(0);

  const queueManager = promisifyAll(await getQueueManager());
  const queueMetrics = await queueManager.getQueueMetricsAsync(
    producer.getQueueName(),
  );
  expect(queueMetrics.deadLettered).toBe(0);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.pendingWithPriority).toBe(1);
});
