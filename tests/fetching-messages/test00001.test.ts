import { promisifyAll } from 'bluebird';
import {
  getMessageManager,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
  produceMessage,
  produceMessageWithPriority,
  scheduleMessage,
} from '../common';

describe('MessageManager', () => {
  test('Case 1', async () => {
    const { message, queue } = await produceMessage();

    const messageManager = promisifyAll(await getMessageManager());
    const res = await messageManager.getPendingMessagesAsync(queue, 0, 100);

    expect(res.total).toBe(1);
    expect(res.items[0].sequenceId).toBe(0);
    expect(res.items[0].message.getId()).toBe(message.getId());
  });

  test('Case 2', async () => {
    const { queue, message } = await produceAndAcknowledgeMessage();

    const messageManager = promisifyAll(await getMessageManager());
    const res = await messageManager.getAcknowledgedMessagesAsync(
      queue,
      0,
      100,
    );

    expect(res.total).toBe(1);
    expect(res.items[0].sequenceId).toBe(0);
    expect(res.items[0].message.getId()).toBe(message.getId());
  });

  test('Case 3', async () => {
    const { queue, message } = await produceAndDeadLetterMessage();

    const messageManager = promisifyAll(await getMessageManager());
    const res = await messageManager.getDeadLetteredMessagesAsync(
      queue,
      0,
      100,
    );
    expect(res.total).toBe(1);
    expect(res.items[0].sequenceId).toBe(0);
    expect(res.items[0].message.getId()).toBe(message.getId());
  });

  test('Case 4', async () => {
    const { queue, message } = await produceMessageWithPriority();

    const messageManager = promisifyAll(await getMessageManager());
    const res = await messageManager.getPendingMessagesWithPriorityAsync(
      queue,
      0,
      100,
    );

    expect(res.total).toBe(1);
    expect(res.items[0].getId()).toBe(message.getId());
  });

  test('Case 5', async () => {
    const { message } = await scheduleMessage();

    const messageManager = promisifyAll(await getMessageManager());
    const res = await messageManager.getScheduledMessagesAsync(0, 100);

    expect(res.total).toBe(1);
    expect(res.items[0].getId()).toBe(message.getId());
  });
});
