import {
  getMessageManager,
  getQueueManager,
  produceAndDeadLetterMessage,
} from '../common';

test('Combined test: Requeue a message from dead-letter queue. Check queue metrics.', async () => {
  const { message, queue, consumer } = await produceAndDeadLetterMessage();
  await consumer.shutdownAsync();

  const messageManager = await getMessageManager();
  await messageManager.deadLetteredMessages.requeueAsync(
    queue,
    0,
    message.getRequiredId(),
  );

  const res1 = await messageManager.priorityMessages.listAsync(queue, 0, 100);
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.pendingMessages.listAsync(queue, 0, 100);
  expect(res2.total).toBe(1);
  expect(res2.items.length).toBe(1);
  expect(res2.items[0].message.getId()).toEqual(message.getRequiredId());

  const res3 = await messageManager.deadLetteredMessages.listAsync(
    queue,
    0,
    100,
  );
  expect(res3.total).toBe(0);
  expect(res3.items.length).toBe(0);

  const queueManager = await getQueueManager();
  const queueMetrics = await queueManager.queueMetrics.getQueueMetricsAsync(
    queue,
  );
  expect(queueMetrics.deadLettered).toBe(0);
  expect(queueMetrics.pending).toBe(1);
  expect(queueMetrics.pendingWithPriority).toBe(0);
});
