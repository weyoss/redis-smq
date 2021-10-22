import {
  getConsumer,
  getProducer,
  getRedisInstance,
  untilConsumerIdle,
} from './common';
import { Message } from '../src/message';
import { TQueueMetadata } from '../types';
import { config } from './config';
import { promisifyAll } from 'bluebird';
import { metadata } from '../src/system/metadata';

describe('Queue Metadata: check that queue metadata are valid', () => {
  test('Case 1', async () => {
    const producer = getProducer();
    const consumer = getConsumer({
      consumeMock: jest.fn(() => {
        throw new Error('Explicit error');
      }),
    });

    const msg = new Message();
    msg.setBody({ hello: 'world' });
    await producer.produceMessageAsync(msg);

    const client = await getRedisInstance();
    const m = await new Promise<TQueueMetadata>((resolve, reject) => {
      metadata.getQueueMetadata(
        client,
        consumer.getQueueName(),
        (err, data) => {
          if (err) reject(err);
          else if (!data) reject(new Error('Expected a non empty reply'));
          else resolve(data);
        },
      );
    });

    expect(m.pending).toBe(1);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLetter).toBe(0);
    expect(m.scheduled).toBe(0);
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

    const client = await getRedisInstance();
    const m = await new Promise<TQueueMetadata>((resolve, reject) => {
      metadata.getQueueMetadata(
        client,
        consumer.getQueueName(),
        (err, data) => {
          if (err) reject(err);
          else if (!data) reject(new Error('Expected a non empty reply'));
          else resolve(data);
        },
      );
    });

    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLetter).toBe(1);
    expect(m.scheduled).toBe(0);
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

    const client = await getRedisInstance();
    const m = await new Promise<TQueueMetadata>((resolve, reject) => {
      metadata.getQueueMetadata(
        client,
        consumer.getQueueName(),
        (err, data) => {
          if (err) reject(err);
          else if (!data) reject(new Error('Expected a non empty reply'));
          else resolve(data);
        },
      );
    });

    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(1);
    expect(m.deadLetter).toBe(0);
    expect(m.scheduled).toBe(0);
  });

  test('Case 4', async () => {
    const producer = getProducer();

    const msg = new Message();
    msg.setScheduledDelay(10000);
    await producer.produceMessageAsync(msg);

    const client = await getRedisInstance();
    const m = await new Promise<TQueueMetadata>((resolve, reject) => {
      metadata.getQueueMetadata(
        client,
        producer.getQueueName(),
        (err, data) => {
          if (err) reject(err);
          else if (!data) reject(new Error('Expected a non empty reply'));
          else resolve(data);
        },
      );
    });

    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(0);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLetter).toBe(0);
    expect(m.scheduled).toBe(1);
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

    const client = await getRedisInstance();
    const m = await new Promise<TQueueMetadata>((resolve, reject) => {
      metadata.getQueueMetadata(
        client,
        producer.getQueueName(),
        (err, data) => {
          if (err) reject(err);
          else if (!data) reject(new Error('Expected a non empty reply'));
          else resolve(data);
        },
      );
    });

    expect(m.pending).toBe(0);
    expect(m.pendingWithPriority).toBe(1);
    expect(m.acknowledged).toBe(0);
    expect(m.deadLetter).toBe(0);
    expect(m.scheduled).toBe(0);
  });
});
