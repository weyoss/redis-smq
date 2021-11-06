import {
  getConsumer,
  getMessageManager,
  getProducer,
  getQueueManager,
  untilMessageAcknowledged,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys';

test('Combined test: Requeue a message from acknowledged queue with priority. Check both queue metadata and message metadata.  Check both pending and acknowledged messages. Check queue metrics.', async () => {
  const producer = getProducer();
  const queueName = producer.getQueueName();
  const ns = redisKeys.getNamespace();

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const consumer = getConsumer({
    consumeMock: (m, cb) => {
      cb();
    },
  });
  await consumer.runAsync();

  await untilMessageAcknowledged(consumer);
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManager());
  await messageManager.requeueMessageFromAcknowledgedQueueAsync(
    ns,
    queueName,
    0,
    msg.getId(),
    true,
    undefined,
  );

  const res5 = await messageManager.getPendingMessagesAsync(
    ns,
    queueName,
    0,
    100,
  );

  expect(res5.total).toBe(0);
  expect(res5.items.length).toBe(0);

  const res6 = await messageManager.getPendingMessagesWithPriorityAsync(
    ns,
    queueName,
    0,
    100,
  );

  expect(res6.total).toBe(1);
  expect(res6.items.length).toBe(1);

  // assign default consumer options
  const msg1 = Message.createFromMessage(msg).setPriority(
    Message.MessagePriority.NORMAL,
  );
  expect(res6.items[0].message).toEqual(msg1);

  const res7 = await messageManager.getAcknowledgedMessagesAsync(
    ns,
    queueName,
    0,
    100,
  );
  expect(res7.total).toBe(0);
  expect(res7.items.length).toBe(0);

  const queueManager = promisifyAll(await getQueueManager());
  const queueMetrics = await queueManager.getQueueMetricsAsync(ns, queueName);
  expect(queueMetrics.acknowledged).toBe(0);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.pendingWithPriority).toBe(1);

  await expect(async () => {
    await messageManager.requeueMessageFromAcknowledgedQueueAsync(
      ns,
      queueName,
      0,
      msg.getId(),
      true,
      undefined,
    );
  }).rejects.toThrow('Message not found');
});
