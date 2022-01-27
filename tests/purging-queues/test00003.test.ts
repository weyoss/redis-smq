import {
  getMessageManager,
  getQueueManagerFrontend,
  produceAndAcknowledgeMessage,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Purging acknowledged queue', async () => {
  const { queue, consumer } = await produceAndAcknowledgeMessage();
  await consumer.shutdownAsync();

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const m = await queueManager.getQueueMetricsAsync(queue);

  expect(m.acknowledged).toBe(1);

  const messageManager = promisifyAll(await getMessageManager());
  await messageManager.purgeAcknowledgedMessagesAsync(queue);

  const m2 = await queueManager.getQueueMetricsAsync(queue);
  expect(m2.acknowledged).toBe(0);
});
