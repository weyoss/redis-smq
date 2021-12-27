import {
  getQueueManagerFrontend,
  produceAndAcknowledgeMessage,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Purging acknowledged queue', async () => {
  const { producer } = await produceAndAcknowledgeMessage();
  const queue = producer.getQueue();

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const m = await queueManager.getQueueMetricsAsync(queue);

  expect(m.acknowledged).toBe(1);

  await queueManager.purgeAcknowledgedMessagesQueueAsync(queue);

  const m2 = await queueManager.getQueueMetricsAsync(queue);
  expect(m2.acknowledged).toBe(0);
});
