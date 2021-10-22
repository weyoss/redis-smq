import {
  getConsumer,
  getMessageManager,
  getProducer,
  untilConsumerIdle,
} from './common';
import { Message } from '../src/message';
import { promisifyAll } from 'bluebird';
import { config } from './config';
import { EMessageMetadata } from '../types';

describe('MessageManager', () => {
  test('Case 1', async () => {
    const producer = getProducer();

    const msg = new Message();
    msg.setBody({ hello: 'world' });
    await producer.produceMessageAsync(msg);

    const messageManager = promisifyAll(await getMessageManager());
    const res = await messageManager.getPendingMessagesAsync(
      producer.getQueueName(),
      0,
      100,
    );

    expect(res.total).toBe(1);
    expect(res.items[0].getId()).toBe(msg.getId());
  });

  test('Case 2', async () => {
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

    const messageManager = promisifyAll(await getMessageManager());
    const res = await messageManager.getAcknowledgedMessagesAsync(
      producer.getQueueName(),
      0,
      100,
    );

    expect(res.total).toBe(1);
    expect(res.items[0].getId()).toBe(msg.getId());
  });

  test('Case 3', async () => {
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

    const messageManager = promisifyAll(await getMessageManager());
    const res = await messageManager.getDeadLetterMessagesAsync(
      producer.getQueueName(),
      0,
      100,
    );

    expect(res.total).toBe(1);
    expect(res.items[0].getId()).toBe(msg.getId());
  });

  test('Case 4', async () => {
    const cfg = {
      ...config,
      priorityQueue: true,
    };
    const queueName = 'test_queue';
    const producer = promisifyAll(getProducer(queueName, cfg));

    const msg = new Message();
    msg.setPriority(Message.MessagePriority.LOW);
    await producer.produceMessageAsync(msg);

    const messageManager = promisifyAll(await getMessageManager());
    const res = await messageManager.getPendingMessagesWithPriorityAsync(
      producer.getQueueName(),
      0,
      100,
    );

    expect(res.total).toBe(1);
    expect(res.items[0].getId()).toBe(msg.getId());
  });

  test('Case 5', async () => {
    const producer = getProducer();

    const msg = new Message();
    msg.setScheduledDelay(10000);
    await producer.produceMessageAsync(msg);

    const messageManager = promisifyAll(await getMessageManager());
    const res = await messageManager.getScheduledMessagesAsync(
      producer.getQueueName(),
      0,
      100,
    );

    expect(res.total).toBe(1);
    expect(res.items[0].getId()).toBe(msg.getId());
  });

  test('Case 6', async () => {
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

    const messageManager = promisifyAll(await getMessageManager());
    const metadata = await messageManager.getMessageMetadataListAsync(
      msg.getId(),
    );

    expect(metadata.length).toBe(2);
    expect(metadata[0].type).toBe(EMessageMetadata.ENQUEUED);
    expect(metadata[1].type).toBe(EMessageMetadata.ACKNOWLEDGED);
  });
});
