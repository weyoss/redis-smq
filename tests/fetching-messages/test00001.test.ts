import { promisifyAll } from 'bluebird';
import {
  getMessageManagerFrontend,
  getProducer,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
} from '../common';
import { Message } from '../../src/message';
import { config } from '../config';

describe('MessageManager', () => {
  test('Case 1', async () => {
    const producer = getProducer();
    const { ns, name } = producer.getQueue();

    const msg = new Message();
    msg.setBody({ hello: 'world' });
    await producer.produceMessageAsync(msg);

    const messageManager = promisifyAll(await getMessageManagerFrontend());
    const res = await messageManager.getPendingMessagesAsync(name, ns, 0, 100);

    expect(res.total).toBe(1);
    expect(res.items[0].sequenceId).toBe(0);
    expect(res.items[0].message.getId()).toBe(msg.getId());
  });

  test('Case 2', async () => {
    const { producer, message } = await produceAndAcknowledgeMessage();
    const { ns, name } = producer.getQueue();

    const messageManager = promisifyAll(await getMessageManagerFrontend());
    const res = await messageManager.getAcknowledgedMessagesAsync(
      name,
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
    const { ns, name } = producer.getQueue();

    const messageManager = promisifyAll(await getMessageManagerFrontend());
    const res = await messageManager.getDeadLetterMessagesAsync(
      name,
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
    const producer = promisifyAll(getProducer(undefined, cfg));
    const { ns, name } = producer.getQueue();

    const msg = new Message();
    msg.setPriority(Message.MessagePriority.LOW);
    await producer.produceMessageAsync(msg);

    const messageManager = promisifyAll(await getMessageManagerFrontend());
    const res = await messageManager.getPendingMessagesWithPriorityAsync(
      name,
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
