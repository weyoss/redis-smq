import {
  getMessageManager,
  getQueueManager,
  produceAndAcknowledgeMessage,
} from '../common';

test('Purging acknowledged queue', async () => {
  const { queue, consumer } = await produceAndAcknowledgeMessage();
  await consumer.shutdownAsync();

  const queueManager = await getQueueManager();
  const m = await queueManager.queueMetrics.getQueueMetricsAsync(queue);

  expect(m.acknowledged).toBe(1);

  const messageManager = await getMessageManager();
  await messageManager.acknowledgedMessages.purgeAsync(queue);

  const m2 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m2.acknowledged).toBe(0);
});
