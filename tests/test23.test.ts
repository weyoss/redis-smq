import {
  getConsumer,
  getProducer,
  getQueueManager,
  untilConsumerIdle,
} from './common';
import { Message } from '../src/message';
import { config } from './config';
import { promisifyAll } from 'bluebird';

describe('Queue metrics: check that queue metrics are valid', () => {
  test('Case 1', async () => {
    const producer = getProducer();

    const msg = new Message();
    msg.setBody({ hello: 'world' });
    await producer.produceMessageAsync(msg);

    const queueManager = promisifyAll(await getQueueManager());
    const m = await queueManager.getQueueMetricsAsync(producer.getQueueName());

    expect(m.pending).toBe(1);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 2', async () => {
    const producer = getProducer();
    const consumer = getConsumer({
      consumeMock: jest.fn(() => {
        throw new Error('Explicit error');
      }),
    });

    const msg = new Message();
    msg.setBody({ hello: 'world' });
    await producer.produceMessageAsync(msg);

    consumer.run();
    await untilConsumerIdle(consumer);

    const queueManager = promisifyAll(await getQueueManager());
    const m = await queueManager.getQueueMetricsAsync(producer.getQueueName());

    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(1);
  });

  test('Case 3', async () => {
    const producer = getProducer();
    const consumer = getConsumer({
      consumeMock: jest.fn((msg, cb) => {
        cb();
      }),
    });

    const msg = new Message();
    msg.setBody({ hello: 'world' });
    await producer.produceMessageAsync(msg);

    consumer.run();
    await untilConsumerIdle(consumer);

    const queueManager = promisifyAll(await getQueueManager());
    const m = await queueManager.getQueueMetricsAsync(producer.getQueueName());

    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(1);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 4', async () => {
    const producer = getProducer();

    const msg = new Message();
    msg.setScheduledDelay(10000);
    await producer.produceMessageAsync(msg);

    const queueManager = promisifyAll(await getQueueManager());
    const m = await queueManager.getQueueMetricsAsync(producer.getQueueName());

    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });

  test('Case 5', async () => {
    const cfg = {
      ...config,
      priorityQueue: true,
    };
    const queueName = 'test_queue';
    const producer = promisifyAll(getProducer(queueName, cfg));

    const msg = new Message();
    msg.setPriority(Message.MessagePriority.LOW);
    await producer.produceMessageAsync(msg);

    const queueManager = promisifyAll(await getQueueManager());
    const m = await queueManager.getQueueMetricsAsync(producer.getQueueName());

    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(1);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLettered).toBe(0);
  });
});
