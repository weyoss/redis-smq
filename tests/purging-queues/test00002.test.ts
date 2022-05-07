import {
  getMessageManager,
  getQueueManager,
  produceMessageWithPriority,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Purging priority queue', async () => {
  const { queue } = await produceMessageWithPriority();
  const queueManager = promisifyAll(await getQueueManager());

  const m2 = await queueManager.getQueueMetricsAsync(queue);
  expect(m2.pendingWithPriority).toBe(1);

  const messageManager = promisifyAll(await getMessageManager());
  await messageManager.purgePendingMessagesWithPriorityAsync(queue);

  const m3 = await queueManager.getQueueMetricsAsync(queue);
  expect(m3.pendingWithPriority).toBe(0);
});
