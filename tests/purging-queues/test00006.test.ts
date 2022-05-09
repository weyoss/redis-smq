import { getQueueManager, produceAndAcknowledgeMessage } from '../common';

test('Deleting a message queue with all of its data', async () => {
  const { consumer, queue } = await produceAndAcknowledgeMessage();

  const queueManager = await getQueueManager();

  const m1 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m1.acknowledged).toBe(1);

  await expect(async () => {
    await queueManager.queue.deleteQueueAsync(queue);
  }).rejects.toThrow(
    'Before deleting a queue/namespace, make sure it is not used by a message handler',
  );

  await consumer.shutdownAsync();
  await queueManager.queue.deleteQueueAsync(queue);

  const m2 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m2.acknowledged).toBe(0);

  await expect(async () => {
    await queueManager.queue.deleteQueueAsync(queue);
  }).rejects.toThrow('Queue does not exist');
});
