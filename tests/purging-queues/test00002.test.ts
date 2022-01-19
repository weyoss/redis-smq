import { getQueueManagerFrontend, produceMessageWithPriority } from '../common';
import { promisifyAll } from 'bluebird';

test('Purging priority queue', async () => {
  const { queue } = await produceMessageWithPriority();
  const queueManager = promisifyAll(await getQueueManagerFrontend());

  const m2 = await queueManager.getQueueMetricsAsync(queue);
  expect(m2.pendingWithPriority).toBe(1);

  await queueManager.purgePriorityQueueAsync(queue);

  const m3 = await queueManager.getQueueMetricsAsync(queue);
  expect(m3.pendingWithPriority).toBe(0);
});
