import { getMessageManager, getQueueManager, produceMessage } from '../common';

test('Purging pending queue', async () => {
  const { queue } = await produceMessage();
  const queueManager = await getQueueManager();

  const m2 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m2.pending).toBe(1);
  const messageManager = await getMessageManager();
  await messageManager.pendingMessages.purgeAsync(queue);

  const m3 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m3.pending).toBe(0);
});
