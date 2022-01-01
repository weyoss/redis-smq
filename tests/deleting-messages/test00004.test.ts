import {
  getConsumer,
  getMessageManagerFrontend,
  getProducer,
  getQueueManagerFrontend,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Combined test: Delete a dead-letter message. Check pending, acknowledged, and dead-letter messages. Check queue metrics.', async () => {
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
  const msg1 = Message.createFromMessage(msg).setAttempts(2);
  expect(res3.items[0].message).toEqual(msg1);

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(name, ns);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(0);
  expect(queueMetrics.deadLettered).toBe(1);

  await messageManager.deleteDeadLetterMessageAsync(name, ns, 0, msg.getId());

  const res4 = await messageManager.getDeadLetterMessagesAsync(
    name,
    ns,
    0,
    100,
  );

  expect(res4.total).toBe(0);
  expect(res4.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(name, ns);
  expect(queueMetrics1.deadLettered).toBe(0);

  await expect(async () => {
    await messageManager.deleteDeadLetterMessageAsync(name, ns, 0, msg.getId());
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
