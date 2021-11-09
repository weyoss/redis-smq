import {
  getConsumer,
  getMessageManager,
  getProducer,
  getQueueManagerFrontend,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys';

test('Combined test: Dead-letter a message and requeue it. Check pending, acknowledged, pending messages, and queue metrics.', async () => {
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const producer = getProducer();
  await producer.produceMessageAsync(msg);
  const queueName = producer.getQueueName();
  const ns = redisKeys.getNamespace();

  const consumer = getConsumer({
    consumeMock: (m, cb) => {
      throw new Error();
    },
  });
  await consumer.runAsync();
  await untilConsumerIdle(consumer);
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManager());
  const res1 = await messageManager.getPendingMessagesAsync(
    queueName,
    ns,
    0,
    100,
  );
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.getAcknowledgedMessagesAsync(
    queueName,
    ns,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const res3 = await messageManager.getDeadLetterMessagesAsync(
    queueName,
    ns,
    0,
    100,
  );
  expect(res3.total).toBe(1);
  expect(res3.items.length).toBe(1);
  const msg1 = Message.createFromMessage(msg)
    .setTTL(0)
    .setRetryThreshold(3)
    .setRetryDelay(0)
    .setConsumeTimeout(0)
    .setAttempts(2);
  expect(res3.items[0].message).toEqual(msg1);

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(0);
  expect(queueMetrics.deadLettered).toBe(1);

  await messageManager.requeueMessageFromDLQueueAsync(
    queueName,
    ns,
    0,
    msg.getId(),
    false,
    undefined,
  );

  const res5 = await messageManager.getPendingMessagesAsync(
    queueName,
    ns,
    0,
    100,
  );

  expect(res5.total).toBe(1);
  expect(res5.items.length).toBe(1);
  // assign default consumer options
  const msg2 = Message.createFromMessage(msg)
    .setTTL(0)
    .setRetryThreshold(3)
    .setRetryDelay(0)
    .setConsumeTimeout(0);
  expect(res5.items[0].message).toEqual(msg2);

  const res6 = await messageManager.getDeadLetterMessagesAsync(
    queueName,
    ns,
    0,
    100,
  );
  expect(res6.total).toBe(0);
  expect(res6.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(queueMetrics1.deadLettered).toBe(0);
  expect(queueMetrics1.pending).toBe(1);

  await expect(async () => {
    await messageManager.requeueMessageFromDLQueueAsync(
      queueName,
      ns,
      0,
      msg.getId(),
      false,
      undefined,
    );
  }).rejects.toThrow('Message not found');
});
