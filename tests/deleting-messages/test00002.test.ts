import {
  getMessageManager,
  getQueueManager,
  produceMessageWithPriority,
} from '../common';

test('Combined test: Delete a pending message with priority. Check pending messages. Check queue metrics.', async () => {
  const { message, queue } = await produceMessageWithPriority();
  const messageManager = await getMessageManager();
  const res1 = await messageManager.priorityMessages.listAsync(queue, 0, 100);

  expect(res1.total).toBe(1);
  expect(res1.items[0].getId()).toBe(message.getRequiredId());

  const queueManager = await getQueueManager();
  const queueMetrics = await queueManager.queueMetrics.getQueueMetricsAsync(
    queue,
  );
  expect(queueMetrics.pendingWithPriority).toBe(1);

  await messageManager.priorityMessages.deleteAsync(
    queue,
    message.getRequiredId(),
  );
  const res2 = await messageManager.priorityMessages.listAsync(queue, 0, 100);
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.queueMetrics.getQueueMetricsAsync(
    queue,
  );
  expect(queueMetrics1.pending).toBe(0);

  // Deleting a message that was already deleted should not throw an error
  await messageManager.priorityMessages.deleteAsync(
    queue,
    message.getRequiredId(),
  );
});
