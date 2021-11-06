import { getMessageManager, getProducer, getQueueManager } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys';

test('Combined test: Delete a pending message with priority. Check pending messages. Check queue metrics.', async () => {
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const producer = getProducer('test_queue', {
    priorityQueue: true,
  });
  await producer.produceMessageAsync(msg);
  const queueName = producer.getQueueName();
  const ns = redisKeys.getNamespace();

  const messageManager = promisifyAll(await getMessageManager());
  const res1 = await messageManager.getPendingMessagesWithPriorityAsync(
    ns,
    queueName,
    0,
    100,
  );

  expect(res1.total).toBe(1);
  expect(res1.items[0].message.getId()).toBe(msg.getId());

  const queueManager = promisifyAll(await getQueueManager());
  const queueMetrics = await queueManager.getQueueMetricsAsync(ns, queueName);
  expect(queueMetrics.pendingWithPriority).toBe(1);

  await messageManager.deletePendingMessageWithPriorityAsync(
    ns,
    queueName,
    0,
    msg.getId(),
  );
  const res2 = await messageManager.getPendingMessagesWithPriorityAsync(
    ns,
    queueName,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(ns, queueName);
  expect(queueMetrics1.pending).toBe(0);

  await expect(async () => {
    await messageManager.deletePendingMessageAsync(
      ns,
      queueName,
      0,
      msg.getId(),
    );
  }).rejects.toThrow('Message not found');
});
