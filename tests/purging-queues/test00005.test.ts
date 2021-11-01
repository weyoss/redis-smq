import { getMessageManager, getProducer, getQueueManager } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Purging scheduled messages queue', async () => {
  const producer = promisifyAll(getProducer());

  const msg = new Message()
    .setScheduledDelay(10000)
    .setBody({ hello: 'world' });
  await producer.produceMessageAsync(msg);

  const messageManager = promisifyAll(await getMessageManager());
  const m = await messageManager.getScheduledMessagesAsync(0, 99);

  expect(m.total).toBe(1);
  expect(m.items[0].message.getId()).toBe(msg.getId());

  const queueManager = promisifyAll(await getQueueManager());
  await queueManager.purgeScheduledMessagesQueueAsync();

  const m2 = await messageManager.getScheduledMessagesAsync(0, 99);
  expect(m2.total).toBe(0);
  expect(m2.items.length).toBe(0);
});
