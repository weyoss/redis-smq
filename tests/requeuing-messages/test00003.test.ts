import {
  getMessageManager,
  getQueueManagerFrontend,
  produceAndAcknowledgeMessage,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Combined test: Requeue a message from acknowledged queue with priority. Check both queue metadata and message metadata.  Check both pending and acknowledged messages. Check queue metrics.', async () => {
  const { queue, message, consumer } = await produceAndAcknowledgeMessage();
  await consumer.shutdownAsync();

  const messageManager = promisifyAll(await getMessageManager());
  await messageManager.requeueAcknowledgedMessageAsync(
    queue,
    0,
    message.getRequiredId(),
    Message.MessagePriority.HIGHEST,
  );

  const res5 = await messageManager.getPendingMessagesAsync(queue, 0, 100);

  expect(res5.total).toBe(0);
  expect(res5.items.length).toBe(0);

  const res6 = await messageManager.getPendingMessagesWithPriorityAsync(
    queue,
    0,
    100,
  );

  expect(res6.total).toBe(1);
  expect(res6.items.length).toBe(1);

  // assign default consumer options
  expect(res6.items[0].getId()).toEqual(message.getRequiredId());
  expect(res6.items[0].getPriority()).toEqual(Message.MessagePriority.HIGHEST);

  const res7 = await messageManager.getAcknowledgedMessagesAsync(queue, 0, 100);
  expect(res7.total).toBe(0);
  expect(res7.items.length).toBe(0);

  const queueManager = promisifyAll(await getQueueManagerFrontend());
  const queueMetrics = await queueManager.getQueueMetricsAsync(queue);
  expect(queueMetrics.acknowledged).toBe(0);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.pendingWithPriority).toBe(1);

  await expect(async () => {
    await messageManager.requeueAcknowledgedMessageAsync(
      queue,
      0,
      message.getRequiredId(),
      Message.MessagePriority.HIGHEST,
    );
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
