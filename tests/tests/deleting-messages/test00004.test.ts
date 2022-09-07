import { Message } from '../../../src/lib/message/message';
import { getQueueManager } from '../../common/queue-manager';
import { getMessageManager } from '../../common/message-manager';
import {
  createQueue,
  defaultQueue,
  produceAndDeadLetterMessage,
} from '../../common/message-producing-consuming';

test('Combined test: Delete a dead-letter message. Check pending, acknowledged, and dead-letter messages. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);
  const { queue, message } = await produceAndDeadLetterMessage();
  const messageManager = await getMessageManager();

  const res1 = await messageManager.pendingMessages.listAsync(queue, 0, 100);
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.acknowledgedMessages.listAsync(
    queue,
    0,
    100,
  );
  expect(res2.total).toBe(0);
  expect(res2.items.length).toBe(0);

  const res3 = await messageManager.deadLetteredMessages.listAsync(
    queue,
    0,
    100,
  );
  expect(res3.total).toBe(1);
  expect(res3.items.length).toBe(1);
  const msg1 = Message.createFromMessage(message);
  msg1.getRequiredMessageState().setAttempts(2);
  expect(res3.items[0].message).toEqual(msg1);

  const queueManager = await getQueueManager();
  const queueMetrics = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(0);
  expect(queueMetrics.deadLettered).toBe(1);

  await messageManager.deadLetteredMessages.deleteAsync(
    queue,
    message.getRequiredId(),
    0,
  );

  const res4 = await messageManager.deadLetteredMessages.listAsync(
    queue,
    0,
    100,
  );

  expect(res4.total).toBe(0);
  expect(res4.items.length).toBe(0);

  const queueMetrics1 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(queueMetrics1.deadLettered).toBe(0);

  await expect(async () => {
    await messageManager.deadLetteredMessages.deleteAsync(
      queue,
      message.getRequiredId(),
      0,
    );
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
