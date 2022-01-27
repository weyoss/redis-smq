import {
  getMessageManager,
  getQueueManagerFrontend,
  produceAndDeadLetterMessage,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Combined test: Requeue a message from dead-letter queue with priority.  Check both pending and acknowledged messages. Check queue metrics.', async () => {
  const { message, queue, consumer } = await produceAndDeadLetterMessage();
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManager());
  await messageManager.requeueDeadLetteredMessageAsync(
    queue,
    0,
    message.getId(),
    Message.MessagePriority.HIGHEST,
  );

  const res1 = await messageManager.getPendingMessagesAsync(queue, 0, 100);
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.getPendingMessagesWithPriorityAsync(
    queue,
    0,
    100,
  );
  expect(res2.total).toBe(1);
  expect(res2.items.length).toBe(1);
  expect(res2.items[0].getId()).toEqual(message.getId());
  expect(res2.items[0].getPriority()).toEqual(Message.MessagePriority.HIGHEST);

  const res3 = await messageManager.getDeadLetteredMessagesAsync(queue, 0, 100);
  expect(res3.total).toBe(0);
  expect(res3.items.length).toBe(0);

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.deadLettered).toBe(0);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.pendingWithPriority).toBe(1);
});
