import { getRedisInstance, produceMessage } from '../common';
import { promisifyAll } from 'bluebird';
import { QueueManager } from '../../src/queue-manager';

test('Concurrently deleting a message queue', async () => {
  const { queue } = await produceMessage();

  const redisClient1 = await getRedisInstance();
  const queueManager1 = promisifyAll(new QueueManager(redisClient1));

  const redisClient2 = promisifyAll(await getRedisInstance());
  const queueManager2 = promisifyAll(new QueueManager(redisClient2));

  const m1 = await queueManager1.getQueueMetricsAsync(queue);
  expect(m1).toEqual({
    acknowledged: 0,
    pendingWithPriority: 0,
    deadLettered: 0,
    pending: 1,
  });
  await expect(async () => {
    await Promise.all([
      queueManager1.deleteMessageQueueAsync(queue),
      queueManager2.deleteMessageQueueAsync(queue),
    ]);
  }).rejects.toThrow('Redis transaction has been abandoned. Try again.');

  const m2 = await queueManager1.getQueueMetricsAsync(queue);
  expect(m2).toEqual({
    acknowledged: 0,
    pendingWithPriority: 0,
    deadLettered: 0,
    pending: 0,
  });
});
