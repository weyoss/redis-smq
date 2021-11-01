import { getMessageManager, getProducer, getQueueManager } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Concurrent delete operation', async () => {
  const producer = getProducer();

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const messageManager = promisifyAll(await getMessageManager());
  const res1 = await messageManager.getPendingMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );

  expect(res1.total).toBe(1);
  expect(res1.items[0].message.getId()).toBe(msg.getId());

  const queueManager = promisifyAll(await getQueueManager());
  const queueMetrics = await queueManager.getQueueMetricsAsync(
    producer.getQueueName(),
  );
  expect(queueMetrics.pending).toBe(1);

  await expect(async () => {
    await Promise.all([
      messageManager.deletePendingMessageAsync(
        producer.getQueueName(),
        0,
        msg.getId(),
      ),
      messageManager.deletePendingMessageAsync(
        producer.getQueueName(),
        0,
        msg.getId(),
      ),
    ]);
  }).rejects.toThrow('Could not acquire a  lock. Try again later.');

  const res2 = await messageManager.getPendingMessagesAsync(
    producer.getQueueName(),
    0,
    100,
  );

  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(
    producer.getQueueName(),
  );
  expect(queueMetrics1.pending).toBe(0);
});
