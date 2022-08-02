import { delay } from 'bluebird';
import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { getMessageManager } from '../../common/message-manager';
import { untilConsumerEvent } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

test('Setting default message TTL from configuration', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');

  let unacks = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacks += 1;
  });
  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue).setTTL(2000);

  await producer.produceAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerEvent(consumer, events.MESSAGE_DEAD_LETTERED);

  expect(consume).toHaveBeenCalledTimes(0);
  expect(unacks).toBe(1);
  const messageManager = await getMessageManager();
  const list = await messageManager.deadLetteredMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(list.total).toBe(1);
  expect(list.items[0].message.getId()).toBe(msg.getRequiredId());
});
