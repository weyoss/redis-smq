import {
  getConsumer,
  getProducer,
  getRedisInstance,
  untilConsumerIdle,
} from './common';
import { Message } from '../src/message';
import { Metadata } from '../src/metadata';
import { TQueueMetadata } from '../types';
import { config } from './config';
import { promisifyAll } from 'bluebird';

describe('Metadata: check that queue metadata are valid', () => {
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
    const metadata = await new Promise<TQueueMetadata>((resolve, reject) => {
      Metadata.getQueueMetadata(
        client,
        consumer.getQueueName(),
        (err, data) => {
          if (err) reject(err);
          else if (!data) reject(new Error('Expected a non empty reply'));
          else resolve(data);
        },
      );
    });

    expect(metadata.pending).toBe(1);
    expect(metadata.pendingWithPriority).toBe(0);
    expect(metadata.acknowledged).toBe(0);
    expect(metadata.deadLetter).toBe(0);
    expect(metadata.scheduled).toBe(0);
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
    const metadata = await new Promise<TQueueMetadata>((resolve, reject) => {
      Metadata.getQueueMetadata(
        client,
        consumer.getQueueName(),
        (err, data) => {
          if (err) reject(err);
          else if (!data) reject(new Error('Expected a non empty reply'));
          else resolve(data);
        },
      );
    });

    expect(metadata.pending).toBe(0);
    expect(metadata.pendingWithPriority).toBe(0);
    expect(metadata.acknowledged).toBe(0);
    expect(metadata.deadLetter).toBe(1);
    expect(metadata.scheduled).toBe(0);
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
    const metadata = await new Promise<TQueueMetadata>((resolve, reject) => {
      Metadata.getQueueMetadata(
        client,
        consumer.getQueueName(),
        (err, data) => {
          if (err) reject(err);
          else if (!data) reject(new Error('Expected a non empty reply'));
          else resolve(data);
        },
      );
    });

    expect(metadata.pending).toBe(0);
    expect(metadata.pendingWithPriority).toBe(0);
    expect(metadata.acknowledged).toBe(1);
    expect(metadata.deadLetter).toBe(0);
    expect(metadata.scheduled).toBe(0);
  });

  test('Case 4', async () => {
    const msg = new Message();
    msg.setScheduledDelay(10);

    const producer = getProducer();
    await producer.produceMessageAsync(msg);

    const client = await getRedisInstance();
    const metadata = await new Promise<TQueueMetadata>((resolve, reject) => {
      Metadata.getQueueMetadata(
        client,
        producer.getQueueName(),
        (err, data) => {
          if (err) reject(err);
          else if (!data) reject(new Error('Expected a non empty reply'));
          else resolve(data);
        },
      );
    });

    expect(metadata.pending).toBe(0);
    expect(metadata.pendingWithPriority).toBe(0);
    expect(metadata.acknowledged).toBe(0);
    expect(metadata.deadLetter).toBe(0);
    expect(metadata.scheduled).toBe(1);
  });

  test('Case 5', async () => {
    const msg = new Message();
    msg.setPriority(Message.MessagePriority.LOW);

    const cfg = {
      ...config,
      priorityQueue: true,
    };
    const queueName = 'test_queue';
    const producer = promisifyAll(getProducer(queueName, cfg));
    await producer.produceMessageAsync(msg);

    const client = await getRedisInstance();
    const metadata = await new Promise<TQueueMetadata>((resolve, reject) => {
      Metadata.getQueueMetadata(
        client,
        producer.getQueueName(),
        (err, data) => {
          if (err) reject(err);
          else if (!data) reject(new Error('Expected a non empty reply'));
          else resolve(data);
        },
      );
    });

    expect(metadata.pending).toBe(0);
    expect(metadata.pendingWithPriority).toBe(1);
    expect(metadata.acknowledged).toBe(0);
    expect(metadata.deadLetter).toBe(0);
    expect(metadata.scheduled).toBe(0);
  });
});
