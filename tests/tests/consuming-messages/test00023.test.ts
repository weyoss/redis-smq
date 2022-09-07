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

test('Periodic scheduled messages upon consume failures are dead-lettered without being re-queued', async () => {
  await createQueue(defaultQueue, false);

  const consumer = getConsumer({
    messageHandler: jest.fn(() => {
      throw new Error();
    }),
  });

  const msg = new Message()
    .setScheduledRepeat(10)
    .setScheduledRepeatPeriod(60000)
    .setBody('message body')
    .setRetryThreshold(5)
    .setQueue(defaultQueue);
  const producer = getProducer();
  await producer.runAsync();

  await producer.produceAsync(msg);

  consumer.run();
  await untilConsumerEvent(consumer, events.MESSAGE_DEAD_LETTERED);
  const messageManager = await getMessageManager();
  const res = await messageManager.deadLetteredMessages.listAsync(
    defaultQueue,
    0,
    99,
  );
  expect(res.total).toBe(1);
  expect(typeof res.items[0].message.getId()).toBe('string');
  expect(res.items[0].message.getId()).toBe(msg.getId());
  expect(res.items[0].message.getMessageState()?.getAttempts()).toBe(0);
});
