import {
  getMessageManager,
  getQueueManager,
  produceAndDeadLetterMessage,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Purging dead letter queue', async () => {
  const { queue, consumer } = await produceAndDeadLetterMessage();
  await consumer.shutdownAsync();

  const queueManager = promisifyAll(await getQueueManager());
  const m = await queueManager.getQueueMetricsAsync(queue);
  expect(m.deadLettered).toBe(1);

  const messageManager = promisifyAll(await getMessageManager());
  await messageManager.purgeDeadLetteredMessagesAsync(queue);

  const m2 = await queueManager.getQueueMetricsAsync(queue);
  expect(m2.deadLettered).toBe(0);
});
