import {
  getConsumer,
  getMessageManagerFrontend,
  getProducer,
  getQueueManagerFrontend,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test(`Combined test: Dead-letter a message and requeue it with priority. Check pending, acknowledged and pending messages.`, async () => {
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const producer = getProducer();
  await producer.produceMessageAsync(msg);
  const { ns, name } = producer.getQueue();

  const consumer = getConsumer({
    consumeMock: (m, cb) => {
      throw new Error();
    },
  });
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManagerFrontend());
  const res1 = await messageManager.getPendingMessagesAsync(name, ns, 0, 100);
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.getAcknowledgedMessagesAsync(
    name,
    ns,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const res3 = await messageManager.getDeadLetterMessagesAsync(
    name,
    ns,
    0,
    100,
  );
  expect(res3.total).toBe(1);
  expect(res3.items.length).toBe(1);
  expect(res3.items[0].message.getId()).toEqual(msg.getId());
  expect(res3.items[0].message.getAttempts()).toEqual(2);

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(name, ns);
  expect(queueMetrics.pendingWithPriority).toBe(0);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(0);
  expect(queueMetrics.deadLettered).toBe(1);

  await messageManager.requeueMessageFromDLQueueAsync(
    name,
    ns,
    0,
    msg.getId(),
    true,
    undefined,
  );

  const res5 = await messageManager.getPendingMessagesAsync(name, ns, 0, 100);
  expect(res5.total).toBe(0);
  expect(res5.items.length).toBe(0);

  const res6 = await messageManager.getPendingMessagesWithPriorityAsync(
    name,
    ns,
    0,
    100,
  );
  expect(res6.total).toBe(1);
  expect(res6.items.length).toBe(1);

  expect(res6.items[0].getId()).toEqual(msg.getId());
  expect(res6.items[0].getPriority()).toEqual(Message.MessagePriority.NORMAL);
  expect(res6.items[0].getAttempts()).toEqual(0);

  const res7 = await messageManager.getDeadLetterMessagesAsync(
    name,
    ns,
    0,
    100,
  );
  expect(res7.total).toBe(0);
  expect(res7.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(name, ns);
  expect(queueMetrics1.deadLettered).toBe(0);
  expect(queueMetrics1.pending).toBe(0);
  expect(queueMetrics1.pendingWithPriority).toBe(1);

  await expect(async () => {
    await messageManager.requeueMessageFromDLQueueAsync(
      name,
      ns,
      0,
      msg.getId(),
      true,
      undefined,
    );
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
