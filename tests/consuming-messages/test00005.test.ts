import { delay } from 'bluebird';
import {
  createQueue,
  defaultQueue,
  getConsumer,
  getMessageManager,
  getProducer,
  mockConfiguration,
  untilConsumerEvent,
} from '../common';
import { Message } from '../../src/lib/message/message';
import { events } from '../../src/common/events';

test('Setting default message TTL from configuration', async () => {
  mockConfiguration({
    messages: {
      consumeOptions: {
        ttl: 2000,
      },
    },
  });
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');

  let unacks = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacks += 1;
  });
  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

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
