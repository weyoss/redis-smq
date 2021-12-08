import {
  getMessageManagerFrontend,
  getProducer,
  getQueueManagerFrontend,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys/redis-keys';

test('Combined test: Delete a pending message with priority. Check pending messages. Check queue metrics.', async () => {
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const producer = getProducer('test_queue', {
    priorityQueue: true,
  });
  await producer.produceMessageAsync(msg);
  const queueName = producer.getQueueName();
  const ns = redisKeys.getNamespace();

  const messageManager = promisifyAll(await getMessageManagerFrontend());
  const res1 = await messageManager.getPendingMessagesWithPriorityAsync(
    queueName,
    ns,
    0,
    100,
  );

  expect(res1.total).toBe(1);
  expect(res1.items[0].getId()).toBe(msg.getId());

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(queueMetrics.pendingWithPriority).toBe(1);

  await messageManager.deletePendingMessageWithPriorityAsync(
    queueName,
    ns,
    msg.getId(),
  );
  const res2 = await messageManager.getPendingMessagesWithPriorityAsync(
    queueName,
    ns,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queueName, ns);
  expect(queueMetrics1.pending).toBe(0);

  await expect(async () => {
    await messageManager.deletePendingMessageAsync(
      queueName,
      ns,
      0,
      msg.getId(),
    );
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
