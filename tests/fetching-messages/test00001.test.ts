import { promisifyAll } from 'bluebird';
import {
  getConsumer,
  getMessageManager,
  getProducer,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { config } from '../config';

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
    const res = await messageManager.getScheduledMessagesAsync(0, 100);

    expect(res.total).toBe(1);
    expect(res.items[0].getId()).toBe(msg.getId());
  });
});
