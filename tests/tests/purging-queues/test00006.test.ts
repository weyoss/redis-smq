import { getQueueManager } from '../../common/queue-manager';
import {
  createQueue,
  defaultQueue,
  produceAndAcknowledgeMessage,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';

test('Deleting a message queue with all of its data', async () => {
  await createQueue(defaultQueue, false);
  const { consumer, queue } = await produceAndAcknowledgeMessage();

  const queueManager = await getQueueManager();

  const m1 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(m1.acknowledged).toBe(1);

  await expect(queueManager.queue.deleteAsync(queue)).rejects.toThrow(
    'Before deleting a queue/namespace, make sure it is not used by a message handler',
  );

  await shutDownBaseInstance(consumer);
  await queueManager.queue.deleteAsync(queue);

  await expect(
    queueManager.queueMetrics.getMetricsAsync(queue),
  ).rejects.toThrow('Queue does not exist');

  await expect(queueManager.queue.deleteAsync(queue)).rejects.toThrow(
    'Queue does not exist',
  );
});
