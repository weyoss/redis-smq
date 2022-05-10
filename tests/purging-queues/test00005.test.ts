import {
  createQueue,
  defaultQueue,
  getMessageManager,
  scheduleMessage,
} from '../common';

test('Purging scheduled messages queue', async () => {
  await createQueue(defaultQueue, false);
  const { message } = await scheduleMessage();

  const messageManager = await getMessageManager();
  const m = await messageManager.scheduledMessages.listAsync(0, 99);

  expect(m.total).toBe(1);
  expect(m.items[0].getId()).toBe(message.getRequiredId());

  await messageManager.scheduledMessages.purgeAsync();
  const m2 = await messageManager.scheduledMessages.listAsync(0, 99);
  expect(m2.total).toBe(0);
  expect(m2.items.length).toBe(0);
});
