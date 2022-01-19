import {
  getQueueManagerFrontend,
  produceAndAcknowledgeMessage,
} from '../common';
import { promisifyAll } from 'bluebird';

test('Deleting a message queue with all of its data', async () => {
  const { consumer, queue } = await produceAndAcknowledgeMessage();

  const queueManager = promisifyAll(await getQueueManagerFrontend());

  const m1 = await queueManager.getQueueMetricsAsync(queue);
  expect(m1.acknowledged).toBe(1);

  await expect(async () => {
    await queueManager.deleteMessageQueueAsync(queue);
  }).rejects.toThrow(
    'The queue is currently in use. Before deleting a queue, shutdown all its consumers.',
  );

  await consumer.shutdownAsync();
  await queueManager.deleteMessageQueueAsync(queue);

  const m2 = await queueManager.getQueueMetricsAsync(queue);
  expect(m2.acknowledged).toBe(0);

  await expect(async () => {
    await queueManager.deleteMessageQueueAsync(queue);
  }).rejects.toThrow('Queue does not exist');
});
