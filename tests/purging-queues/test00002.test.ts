import {
  getMessageManager,
  getQueueManager,
  produceMessageWithPriority,
} from '../common';

test('Purging priority queue', async () => {
  const { queue } = await produceMessageWithPriority();
  const queueManager = await getQueueManager();

  const m2 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m2.pendingWithPriority).toBe(1);

  const messageManager = await getMessageManager();
  await messageManager.pendingMessages.purgeAsync(queue);

  const m3 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m3.pendingWithPriority).toBe(0);
});
