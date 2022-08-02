import { Message } from '../../../index';
import { events } from '../../../src/common/events/events';
import { getMessageManager } from '../../common/message-manager';
import { untilConsumerEvent } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

test('An unacknowledged message is dead-lettered and not delivered again, given retryThreshold is 0', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    messageHandler: () => {
      throw new Error();
    },
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue).setRetryThreshold(0);

  expect(msg.getMetadata()).toBe(null);
  expect(msg.getId()).toBe(null);
  await producer.produceAsync(msg);

  consumer.run();
  await untilConsumerEvent(consumer, events.MESSAGE_DEAD_LETTERED);
  const messageManager = await getMessageManager();
  const r = await messageManager.deadLetteredMessages.listAsync(
    defaultQueue,
    0,
    100,
  );
  expect(r.items.length).toBe(1);
  expect(r.items[0].message.getMetadata()?.getAttempts()).toBe(0);
});
