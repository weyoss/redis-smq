import {
  createQueue,
  defaultQueue,
  getMessageManager,
  getQueueManager,
  produceAndAcknowledgeMessage,
} from '../common';

test('Combined test. Requeue a message from acknowledged queue. Check queue metrics.', async () => {
  await createQueue(defaultQueue, false);
  const { consumer, queue, message } = await produceAndAcknowledgeMessage();
  await consumer.shutdownAsync();
  const messageManager = await getMessageManager();
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

  const queueManager = await getQueueManager();
  const queueMetrics = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(queueMetrics.pending).toBe(0);
  expect(queueMetrics.acknowledged).toBe(1);

  await messageManager.acknowledgedMessages.requeueAsync(
    queue,
    message.getRequiredId(),
    0,
  );

  const res5 = await messageManager.pendingMessages.listAsync(queue, 0, 100);

  expect(res5.total).toBe(1);
  expect(res5.items.length).toBe(1);
  expect(res5.items[0].message.getId()).toEqual(message.getRequiredId());

  const res6 = await messageManager.acknowledgedMessages.listAsync(
    queue,
    0,
    100,
  );
  expect(res6.total).toBe(0);
  expect(res6.items.length).toBe(0);

  const queueMetrics1 = await queueManager.queueMetrics.getMetricsAsync(queue);
  expect(queueMetrics1.acknowledged).toBe(0);
  expect(queueMetrics1.pending).toBe(1);

  await expect(async () => {
    await messageManager.acknowledgedMessages.requeueAsync(
      queue,
      message.getRequiredId(),
      0,
    );
  }).rejects.toThrow(
    'Either message parameters are invalid or the message has been already deleted',
  );
});
