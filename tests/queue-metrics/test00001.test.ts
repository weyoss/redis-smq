import {
  getQueueManagerFrontend,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
  produceMessage,
  produceMessageWithPriority,
  scheduleMessage,
} from '../common';
import { promisifyAll } from 'bluebird';

describe('Queue metrics: check that queue metrics are valid', () => {
  test('Case 1', async () => {
    const { queue } = await produceMessage();
    const queueManager = promisifyAll(await getQueueManagerFrontend());
    const m = await queueManager.getQueueMetricsAsync(queue);
    expect(m.pending).toBe(1);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 2', async () => {
    const { queue } = await produceAndDeadLetterMessage();
    const queueManager = promisifyAll(await getQueueManagerFrontend());
    const m = await queueManager.getQueueMetricsAsync(queue);
    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(1);
  });

  test('Case 3', async () => {
    const { queue } = await produceAndAcknowledgeMessage();
    const queueManager = promisifyAll(await getQueueManagerFrontend());
    const m = await queueManager.getQueueMetricsAsync(queue);
    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(1);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 4', async () => {
    const { queue } = await scheduleMessage();
    const queueManager = promisifyAll(await getQueueManagerFrontend());
    const m = await queueManager.getQueueMetricsAsync(queue);
    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 5', async () => {
    const { queue } = await produceMessageWithPriority();
    const queueManager = promisifyAll(await getQueueManagerFrontend());
    const m = await queueManager.getQueueMetricsAsync(queue);
    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(1);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });
});
