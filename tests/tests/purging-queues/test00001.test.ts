import { getQueueManager } from '../../common/queue-manager';
import { getMessageManager } from '../../common/message-manager';
import {
  createQueue,
  defaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming';

test('Purging pending queue', async () => {
  await createQueue(defaultQueue, false);
  const { queue } = await produceMessage();
  const queueManager = await getQueueManager();

  const m2 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(m2.pending).toBe(1);
  const messageManager = await getMessageManager();
  await messageManager.pendingMessages.purgeAsync(queue);

  const m3 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(m3.pending).toBe(0);
});
