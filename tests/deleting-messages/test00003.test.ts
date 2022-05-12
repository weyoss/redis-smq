import {
  createQueue,
  defaultQueue,
  getMessageManager,
  getQueueManager,
  produceAndAcknowledgeMessage,
} from '../common';

test('Combined test: Delete an acknowledged message. Check pending, acknowledged, and dead-letter messages. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);
  const { queue, message } = await produceAndAcknowledgeMessage();
  const messageManager = await getMessageManager();
  const res0 = await messageManager.deadLetteredMessages.listAsync(
    queue,
    0,
    100,
  );
  expect(res0.total).toBe(0);
  expect(res0.items.length).toBe(0);

  const res1 = await messageManager.pendingMessages.listAsync(queue, 0, 100);
  expect(res1.total).toBe(0);
  expect(res1.items.length).toBe(0);

  const res2 = await messageManager.acknowledgedMessages.listAsync(
    queue,
    0,
    100,
  );
  expect(res2.total).toBe(1);
  expect(res2.items.length).toBe(1);
  expect(res2.items[0].message).toEqual(message);

  const queueManager = await getQueueManager();
  const queueMetrics = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(1);

  await messageManager.acknowledgedMessages.deleteAsync(
    queue,
    message.getRequiredId(),
    0,
  );

  const res3 = await messageManager.acknowledgedMessages.listAsync(
    queue,
    0,
    100,
  );
  expect(res3.total).toBe(0);
  expect(res3.items.length).toBe(0);

  const res4 = await messageManager.pendingMessages.listAsync(queue, 0, 100);
  expect(res4.total).toBe(0);
  expect(res4.items.length).toBe(0);

  const res5 = await messageManager.pendingMessages.listAsync(queue, 0, 100);
  expect(res5.total).toBe(0);
  expect(res5.items.length).toBe(0);

  const res6 = await messageManager.deadLetteredMessages.listAsync(
    queue,
    0,
    100,
  );
  expect(res6.total).toBe(0);
  expect(res6.items.length).toBe(0);

  const queueMetrics1 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(queueMetrics1.acknowledged).toBe(0);

  await expect(async () => {
    await messageManager.acknowledgedMessages.deleteAsync(
      queue,
      message.getRequiredId(),
      0,
    );
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
