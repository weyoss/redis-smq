import {
  getProducer,
  getQueueManagerFrontend,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
  produceMessage,
  produceMessageWithPriority,
} from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';
import { redisKeys } from '../../src/system/common/redis-keys';

describe('Queue metrics: check that queue metrics are valid', () => {
  test('Case 1', async () => {
    const { producer } = await produceMessage();
    const queueName = producer.getQueueName();
    const ns = redisKeys.getNamespace();
    const queueManager = promisifyAll(await getQueueManagerFrontend());
    const m = await queueManager.getQueueMetricsAsync(queueName, ns);
    expect(m.pending).toBe(1);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 2', async () => {
    const { producer } = await produceAndDeadLetterMessage();
    const queueName = producer.getQueueName();
    const ns = redisKeys.getNamespace();
    const queueManager = promisifyAll(await getQueueManagerFrontend());
    const m = await queueManager.getQueueMetricsAsync(queueName, ns);
    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(1);
  });

  test('Case 3', async () => {
    const { producer } = await produceAndAcknowledgeMessage();
    const queueName = producer.getQueueName();
    const ns = redisKeys.getNamespace();
    const queueManager = promisifyAll(await getQueueManagerFrontend());
    const m = await queueManager.getQueueMetricsAsync(queueName, ns);
    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(1);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 4', async () => {
    const producer = getProducer();
    const queueName = producer.getQueueName();
    const ns = redisKeys.getNamespace();

    const msg = new Message();
    msg.setScheduledDelay(10000);
    await producer.produceMessageAsync(msg);

    const queueManager = promisifyAll(await getQueueManagerFrontend());
    const m = await queueManager.getQueueMetricsAsync(queueName, ns);

    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 5', async () => {
    const { producer } = await produceMessageWithPriority();
    const queueName = producer.getQueueName();
    const ns = redisKeys.getNamespace();
    const queueManager = promisifyAll(await getQueueManagerFrontend());
    const m = await queueManager.getQueueMetricsAsync(queueName, ns);
    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(1);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });
});
