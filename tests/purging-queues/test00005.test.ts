import { getMessageManagerFrontend, scheduleMessage } from '../common';
import { promisifyAll } from 'bluebird';

test('Purging scheduled messages queue', async () => {
  const { message } = await scheduleMessage();

  const messageManager = promisifyAll(await getMessageManagerFrontend());
  const m = await messageManager.getScheduledMessagesAsync(0, 99);

  expect(m.total).toBe(1);
  expect(m.items[0].getId()).toBe(message.getId());

  await messageManager.purgeScheduledMessagesAsync();
  const m2 = await messageManager.getScheduledMessagesAsync(0, 99);
  expect(m2.total).toBe(0);
  expect(m2.items.length).toBe(0);
});
