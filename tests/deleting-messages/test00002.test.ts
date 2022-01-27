import {
  getMessageManager,
  getQueueManagerFrontend,
  produceMessageWithPriority,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Combined test: Delete a pending message with priority. Check pending messages. Check queue metrics.', async () => {
  const { message, queue } = await produceMessageWithPriority();

  const messageManager = promisifyAll(await getMessageManager());
  const res1 = await messageManager.getPendingMessagesWithPriorityAsync(
    queue,
    0,
    100,
  );

  expect(res1.total).toBe(1);
  expect(res1.items[0].getId()).toBe(message.getId());

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.pendingWithPriority).toBe(1);

  await messageManager.deletePendingMessageWithPriorityAsync(
    queue,
    message.getId(),
  );
  const res2 = await messageManager.getPendingMessagesWithPriorityAsync(
    queue,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics1.pending).toBe(0);

  // Deleting a message that was already deleted should not throw an error
  await messageManager.deletePendingMessageWithPriorityAsync(
    queue,
    message.getId(),
  );
});
