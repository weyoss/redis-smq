import {
  createQueue,
  defaultQueue,
  getQueueManager,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
  produceMessage,
  produceMessageWithPriority,
  scheduleMessage,
} from '../common';

describe('Queue metrics: check that queue metrics are valid', () => {
  test('Case 1', async () => {
    await createQueue(defaultQueue, false);
    const { queue } = await produceMessage();
    const queueManager = await getQueueManager();
    const m = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
    expect(m.pending).toBe(1);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 2', async () => {
    await createQueue(defaultQueue, false);
    const { queue } = await produceAndDeadLetterMessage();
    const queueManager = await getQueueManager();
    const m = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
    expect(m.pending).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(1);
  });

  test('Case 3', async () => {
    await createQueue(defaultQueue, false);
    const { queue } = await produceAndAcknowledgeMessage();
    const queueManager = await getQueueManager();
    const m = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
    expect(m.pending).toBe(0);
    expect(m.acknowledged).toBe(1);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 4', async () => {
    await createQueue(defaultQueue, false);
    const { queue } = await scheduleMessage();
    const queueManager = await getQueueManager();
    const m = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
    expect(m.pending).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 5', async () => {
    await createQueue(defaultQueue, true);
    const { queue } = await produceMessageWithPriority();
    const queueManager = await getQueueManager();
    const m = await queueManager.queueMetrics.getQueueMetricsAsync(queue);
    expect(m.pending).toBe(1);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });
});
