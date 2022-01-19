import {
  getLogger,
  getQueueManagerFrontend,
  getRedisInstance,
  produceMessage,
} from '../common';
import { delay, promisifyAll } from 'bluebird';
import { MessageManager } from '../../src/system/message-manager/message-manager';

test('Concurrent delete operation', async () => {
  const { message, queue } = await produceMessage();
  const redisClient1 = await getRedisInstance();
  const logger = getLogger();
  const messageManager1 = promisifyAll(
    new MessageManager(redisClient1, logger),
  );
  const redisClient2 = promisifyAll(await getRedisInstance());
  const messageManager2 = promisifyAll(
    new MessageManager(redisClient2, logger),
  );

  const res1 = await messageManager1.getPendingMessagesAsync(queue, 0, 100);

  expect(res1.total).toBe(1);
  expect(res1.items[0].message.getId()).toBe(message.getId());

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.pending).toBe(1);

  await expect(async () => {
    await Promise.all([
      messageManager1.deletePendingMessageAsync(queue, 0, message.getId()),
      messageManager2.deletePendingMessageAsync(queue, 0, message.getId()),
    ]);
  }).rejects.toThrow('Could not acquire a  lock. Try again later.');
  await delay(5000);
  const res2 = await messageManager1.getPendingMessagesAsync(queue, 0, 100);

  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics1.pending).toBe(0);
});
