import {
  getMessageManager,
  getQueueManager,
  produceAndDeadLetterMessage,
} from '../common';

test('Purging dead letter queue', async () => {
  const { queue, consumer } = await produceAndDeadLetterMessage();
  await consumer.shutdownAsync();

  const queueManager = await getQueueManager();
  const m = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m.deadLettered).toBe(1);
  const messageManager = await getMessageManager();
  await messageManager.deadLetteredMessages.purgeAsync(queue);

  const m2 = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
  expect(m2.deadLettered).toBe(0);
});
