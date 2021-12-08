import {
  getLogger,
  getQueueManagerFrontend,
  getRedisInstance,
  produceMessage,
} from '../common';
import { delay, promisifyAll } from 'bluebird';
import { MessageManager } from '../../src/system/message-manager/message-manager';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';

test('Concurrent delete operation', async () => {
  const { producer, message } = await produceMessage();
  const redisClient1 = await getRedisInstance();
  const logger = getLogger();
  const messageManager1 = promisifyAll(
    new MessageManager(redisClient1, logger),
  );
  const redisClient2 = promisifyAll(await getRedisInstance());
  const messageManager2 = promisifyAll(
    new MessageManager(redisClient2, logger),
  );
  const queueName = producer.getQueueName();
  const ns = redisKeys.getNamespace();

  const res1 = await messageManager1.getPendingMessagesAsync(
    queueName,
    ns,
    0,
    100,
  );

  expect(res1.total).toBe(1);
  expect(res1.items[0].message.getId()).toBe(message.getId());

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(queueMetrics.pending).toBe(1);

  await expect(async () => {
    await Promise.all([
      messageManager1.deletePendingMessageAsync(
        queueName,
        ns,
        0,
        message.getId(),
      ),
      messageManager2.deletePendingMessageAsync(
        queueName,
        ns,
        0,
        message.getId(),
      ),
    ]);
  }).rejects.toThrow('Could not acquire a  lock. Try again later.');
  await delay(5000);
  const res2 = await messageManager1.getPendingMessagesAsync(
    queueName,
    ns,
    0,
    100,
  );

  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(queueMetrics1.pending).toBe(0);
});
