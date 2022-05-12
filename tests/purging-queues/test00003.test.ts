import {
  createQueue,
  defaultQueue,
  getMessageManager,
  getQueueManager,
  produceAndAcknowledgeMessage,
} from '../common';

test('Purging acknowledged queue', async () => {
  await createQueue(defaultQueue, false);
  const { queue, consumer } = await produceAndAcknowledgeMessage();
  await consumer.shutdownAsync();

  const queueManager = await getQueueManager();
  const m = await queueManager.queueMetrics.getMetricsAsync(queue);

  expect(m.acknowledged).toBe(1);

  const messageManager = await getMessageManager();
  await messageManager.acknowledgedMessages.purgeAsync(queue);

  const m2 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(m2.acknowledged).toBe(0);
});
