import {
  createQueue,
  defaultQueue,
  getMessageManager,
  getProducer,
} from '../common';
import { Message } from '../..';

test('Schedule a message: messageManager.getScheduledMessages()', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  const msg1 = new Message();
  msg1.setScheduledDelay(30000);
  msg1
    .setScheduledCRON('0 * * * * *')
    .setBody({ hello: 'world1' })
    .setQueue(defaultQueue);
  await producer.produceAsync(msg1);

  const msg2 = new Message();
  msg2
    .setScheduledDelay(60000)
    .setBody({ hello: 'world2' })
    .setQueue(defaultQueue);
  await producer.produceAsync(msg2);

  const msg3 = new Message();
  msg3
    .setScheduledDelay(90000)
    .setBody({ hello: 'world3' })
    .setQueue(defaultQueue);
  await producer.produceAsync(msg3);

  const messageManager = await getMessageManager();

  // Page 1
  const pageOne = await messageManager.scheduledMessages.listAsync(0, 2);
  expect(pageOne.total).toEqual(3);
  expect(pageOne.items.length).toEqual(2);
  expect(pageOne.items[0].message.getId()).toEqual(msg1.getMetadata()?.getId());
  expect(pageOne.items[1].message.getId()).toEqual(msg2.getMetadata()?.getId());

  // Page 2
  const pageTwo = await messageManager.scheduledMessages.listAsync(2, 2);
  expect(pageTwo.total).toEqual(3);
  expect(pageTwo.items.length).toEqual(1);
  expect(pageTwo.items[0].message.getId()).toEqual(msg3.getMetadata()?.getId());
});
