import { getMessageManagerFrontend, getProducer } from '../common';
import { Message } from '../../src/message';
import { promisifyAll } from 'bluebird';

test('Schedule a message and check scheduled messages', async () => {
  const producer = getProducer();

  // Message 1
  const msg1 = new Message();
  msg1.setScheduledDelay(30000);
  msg1.setScheduledCron('0 * * * * *').setBody({ hello: 'world1' });
  await producer.produceMessageAsync(msg1);

  // Message 2
  const msg2 = new Message();
  msg2.setScheduledDelay(60000).setBody({ hello: 'world2' });
  const r1 = await producer.produceMessageAsync(msg2);
  expect(r1).toBe(true);

  // Message 3
  const msg3 = new Message();
  msg3.setScheduledDelay(90000).setBody({ hello: 'world3' });
  const r3 = await producer.produceMessageAsync(msg3);
  expect(r3).toBe(true);

  const messageManager = promisifyAll(await getMessageManagerFrontend());

  // Page 1
  const pageOne = await messageManager.getScheduledMessagesAsync(0, 2);
  if (!pageOne) {
    throw new Error('Expected non empty reply');
  }
  expect(pageOne.total).toEqual(3);
  expect(pageOne.items.length).toEqual(2);
  expect(pageOne.items[0].getMessageScheduledDelay()).toEqual(30000);
  expect(pageOne.items[1].getMessageScheduledDelay()).toEqual(60000);

  // Page 2
  const pageTwo = await messageManager.getScheduledMessagesAsync(2, 2);
  if (!pageTwo) {
    throw new Error('Expected non empty reply');
  }
  expect(pageTwo.total).toEqual(3);
  expect(pageTwo.items.length).toEqual(1);
  expect(pageTwo.items[0].getMessageScheduledDelay()).toEqual(90000);
});
