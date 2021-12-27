import {
  getMessageManagerFrontend,
  getProducer,
  getQueueManagerFrontend,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Combined test: Delete a pending message. Check pending messages. Check queue metrics.', async () => {
  const producer = getProducer();
  const queue = producer.getQueue();

  const msg = new Message();
  msg.setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const messageManager = promisifyAll(await getMessageManagerFrontend());
  const res1 = await messageManager.getPendingMessagesAsync(queue, 0, 100);

  expect(res1.total).toBe(1);
  expect(res1.items[0].message.getId()).toBe(msg.getId());

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.pending).toBe(1);

  await messageManager.deletePendingMessageAsync(queue, 0, msg.getId());

  const res2 = await messageManager.getPendingMessagesAsync(queue, 0, 100);

  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics1.pending).toBe(0);

  // Deleting a message that was already deleted should not throw an error
  await messageManager.deletePendingMessageAsync(queue, 0, msg.getId());
});
