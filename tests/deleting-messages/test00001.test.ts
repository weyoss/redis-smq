import {
  getMessageManager,
  getQueueManagerFrontend,
  produceMessage,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Combined test: Delete a pending message. Check pending messages. Check queue metrics.', async () => {
  const { queue, message } = await produceMessage();

  const messageManager = promisifyAll(await getMessageManager());
  const res1 = await messageManager.getPendingMessagesAsync(queue, 0, 100);

  expect(res1.total).toBe(1);
  expect(res1.items[0].message.getId()).toBe(message.getId());

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.pending).toBe(1);

  await messageManager.deletePendingMessageAsync(queue, 0, message.getId());

  const res2 = await messageManager.getPendingMessagesAsync(queue, 0, 100);

  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics1.pending).toBe(0);

  // Deleting a message that was already deleted should not throw an error
  await messageManager.deletePendingMessageAsync(queue, 0, message.getId());
});
