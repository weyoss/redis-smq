import {
  getMessageManagerFrontend,
  getProducer,
  getQueueManagerFrontend,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Combined test: Delete a pending message with priority. Check pending messages. Check queue metrics.', async () => {
  const msg = new Message();
  msg.setBody({ hello: 'world' });
  msg.setPriority(Message.MessagePriority.HIGHEST);

  const producer = getProducer('test_queue');
  await producer.produceAsync(msg);
  const queue = producer.getQueue();

  const messageManager = promisifyAll(await getMessageManagerFrontend());
  const res1 = await messageManager.getPendingMessagesWithPriorityAsync(
    queue,
    0,
    100,
  );

  expect(res1.total).toBe(1);
  expect(res1.items[0].getId()).toBe(msg.getId());

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.pendingWithPriority).toBe(1);

  await messageManager.deletePendingMessageWithPriorityAsync(
    queue,
    msg.getId(),
  );
  const res2 = await messageManager.getPendingMessagesWithPriorityAsync(
    queue,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const queueMetrics1 = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics1.pending).toBe(0);

  // Deleting a message that was already deleted should not throw an error
  await messageManager.deletePendingMessageWithPriorityAsync(
    queue,
    msg.getId(),
  );
});
