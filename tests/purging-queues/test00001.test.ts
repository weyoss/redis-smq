import {
  getMessageManagerFrontend,
  getQueueManagerFrontend,
  produceMessage,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Purging pending queue', async () => {
  const { queue } = await produceMessage();
  const queueManager = promisifyAll(await getQueueManagerFrontend());

  const m2 = await queueManager.getQueueMetricsAsync(queue);
  expect(m2.pending).toBe(1);

  const messageManager = promisifyAll(await getMessageManagerFrontend());
  await messageManager.purgePendingMessagesAsync(queue);

  const m3 = await queueManager.getQueueMetricsAsync(queue);
  expect(m3.pending).toBe(0);
});
