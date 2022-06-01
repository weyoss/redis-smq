import { getQueueManager } from '../../common/queue-manager';
import { getMessageManager } from '../../common/message-manager';
import {
  createQueue,
  defaultQueue,
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming';

test('Purging dead letter queue', async () => {
  await createQueue(defaultQueue, false);
  const { queue, consumer } = await produceAndDeadLetterMessage();
  await consumer.shutdownAsync();

  const queueManager = await getQueueManager();
  const m = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(m.deadLettered).toBe(1);
  const messageManager = await getMessageManager();
  await messageManager.deadLetteredMessages.purgeAsync(queue);

  const m2 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(m2.deadLettered).toBe(0);
});
