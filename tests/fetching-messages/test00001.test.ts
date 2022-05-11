import {
  createQueue,
  defaultQueue,
  getMessageManager,
  produceAndAcknowledgeMessage,
  produceAndDeadLetterMessage,
  produceMessage,
  produceMessageWithPriority,
  scheduleMessage,
} from '../common';

describe('MessageManager', () => {
  test('Case 1', async () => {
    await createQueue(defaultQueue, false);
    const { message, queue } = await produceMessage();
    const messageManager = await getMessageManager();
    const res = await messageManager.pendingMessages.listAsync(queue, 0, 100);

    expect(res.total).toBe(1);
    expect(res.items[0].sequenceId).toBe(0);
    expect(res.items[0].message.getId()).toBe(message.getRequiredId());
  });

  test('Case 2', async () => {
    await createQueue(defaultQueue, false);
    const { queue, message } = await produceAndAcknowledgeMessage();

    const messageManager = await getMessageManager();
    const res = await messageManager.acknowledgedMessages.listAsync(
      queue,
      0,
      100,
    );

    expect(res.total).toBe(1);
    expect(res.items[0].sequenceId).toBe(0);
    expect(res.items[0].message.getId()).toBe(message.getRequiredId());
  });

  test('Case 3', async () => {
    await createQueue(defaultQueue, false);
    const { queue, message } = await produceAndDeadLetterMessage();
    const messageManager = await getMessageManager();
    const res = await messageManager.deadLetteredMessages.listAsync(
      queue,
      0,
      100,
    );
    expect(res.total).toBe(1);
    expect(res.items[0].sequenceId).toBe(0);
    expect(res.items[0].message.getId()).toBe(message.getRequiredId());
  });

  test('Case 4', async () => {
    await createQueue(defaultQueue, true);
    const { queue, message } = await produceMessageWithPriority();
    const messageManager = await getMessageManager();
    const res = await messageManager.pendingMessages.listAsync(queue, 0, 100);

    expect(res.total).toBe(1);
    expect(res.items[0].message.getId()).toBe(message.getRequiredId());
  });

  test('Case 5', async () => {
    await createQueue(defaultQueue, false);
    const { message } = await scheduleMessage();
    const messageManager = await getMessageManager();
    const res = await messageManager.scheduledMessages.listAsync(0, 100);

    expect(res.total).toBe(1);
    expect(res.items[0].message.getId()).toBe(message.getRequiredId());
  });
});
