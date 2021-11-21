import { promisifyAll } from 'bluebird';
import {
  getConsumer,
  getMessageManagerFrontend,
  getProducer,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { config } from '../config';
import { redisKeys } from '../../src/system/common/redis-keys';

describe('MessageManager', () => {
  test('Case 1', async () => {
    const producer = getProducer();
    const queueName = producer.getQueueName();
    const ns = redisKeys.getNamespace();

    const msg = new Message();
    msg.setBody({ hello: 'world' });
    await producer.produceMessageAsync(msg);

    const messageManager = promisifyAll(await getMessageManagerFrontend());
    const res = await messageManager.getPendingMessagesAsync(
      queueName,
      ns,
      0,
      100,
    );

    expect(res.total).toBe(1);
    expect(res.items[0].sequenceId).toBe(0);
    expect(res.items[0].message.getId()).toBe(msg.getId());
  });

  test('Case 2', async () => {
    const { producer, message } = await produceAndAcknowledgeMessage();
    const queueName = producer.getQueueName();
    const ns = redisKeys.getNamespace();

    const messageManager = promisifyAll(await getMessageManagerFrontend());
    const res = await messageManager.getAcknowledgedMessagesAsync(
      queueName,
      ns,
      0,
      100,
    );

    expect(res.total).toBe(1);
    expect(res.items[0].sequenceId).toBe(0);
    expect(res.items[0].message.getId()).toBe(message.getId());
  });

  test('Case 3', async () => {
    const { producer, message } = await produceAndDeadLetterMessage();
    const queueName = producer.getQueueName();
    const ns = redisKeys.getNamespace();
    const messageManager = promisifyAll(await getMessageManagerFrontend());
    const res = await messageManager.getDeadLetterMessagesAsync(
      queueName,
      ns,
      0,
      100,
    );
    expect(res.total).toBe(1);
    expect(res.items[0].sequenceId).toBe(0);
    expect(res.items[0].message.getId()).toBe(message.getId());
  });

  test('Case 4', async () => {
    const cfg = {
      ...config,
      priorityQueue: true,
    };
    const queueName = 'test_queue';
    const producer = promisifyAll(getProducer(queueName, cfg));
    const ns = redisKeys.getNamespace();

    const msg = new Message();
    msg.setPriority(Message.MessagePriority.LOW);
    await producer.produceMessageAsync(msg);

    const messageManager = promisifyAll(await getMessageManagerFrontend());
    const res = await messageManager.getPendingMessagesWithPriorityAsync(
      queueName,
      ns,
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

    const messageManager = promisifyAll(await getMessageManagerFrontend());
    const res = await messageManager.getScheduledMessagesAsync(0, 100);

    expect(res.total).toBe(1);
    expect(res.items[0].getId()).toBe(msg.getId());
  });
});
