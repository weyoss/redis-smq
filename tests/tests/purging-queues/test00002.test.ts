import { getQueueManager } from '../../common/queue-manager';
import { getMessageManager } from '../../common/message-manager';
import {
  createQueue,
  defaultQueue,
  produceMessageWithPriority,
} from '../../common/message-producing-consuming';

test('Purging priority queue', async () => {
  await createQueue(defaultQueue, true);
  const { queue } = await produceMessageWithPriority();
  const queueManager = await getQueueManager();

  const m2 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(m2.pending).toBe(1);

  const messageManager = await getMessageManager();
  await messageManager.pendingMessages.purgeAsync(queue);

  const m3 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(m3.pending).toBe(0);
});
