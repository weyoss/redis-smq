import {
  defaultQueue,
  getConsumer,
  getMessageManager,
  getProducer,
  untilConsumerEvent,
} from '../common';
import { promisifyAll } from 'bluebird';
import { Message } from '../../src/system/app/message/message';
import { events } from '../../src/system/common/events';

test('Periodic scheduled messages upon consume failures are dead-lettered without being re-queued', async () => {
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
  await producer.produceAsync(msg);

  consumer.run();
  await untilConsumerEvent(consumer, events.MESSAGE_DEAD_LETTERED);

  const messageManager = promisifyAll(await getMessageManager());
  const res = await messageManager.getDeadLetteredMessagesAsync(
    defaultQueue,
    0,
    99,
  );
  expect(res.total).toBe(1);
  expect(typeof res.items[0].message.getId()).toBe('string');
  expect(res.items[0].message.getId()).toBe(msg.getId());
  expect(res.items[0].message.getMetadata()?.getAttempts()).toBe(0);
});
