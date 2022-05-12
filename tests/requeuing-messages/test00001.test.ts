import {
  createQueue,
  defaultQueue,
  getMessageManager,
  getQueueManager,
  produceAndDeadLetterMessage,
} from '../common';

test('Combined test: Requeue a message from dead-letter queue. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);
  const { message, queue, consumer } = await produceAndDeadLetterMessage();
  await consumer.shutdownAsync();

  const messageManager = await getMessageManager();
  await messageManager.deadLetteredMessages.requeueAsync(
    queue,
    message.getRequiredId(),
    0,
  );

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
  const queueMetrics = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(queueMetrics.deadLettered).toBe(0);
  expect(queueMetrics.pending).toBe(1);
});
