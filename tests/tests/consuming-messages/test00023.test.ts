import { Message } from '../../../src/lib/message/message';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { getQueueDeadLetteredMessages } from '../../common/queue-dead-lettered-messages';
import { untilConsumerEvent } from '../../common/events';
import { events } from '../../../src/common/events/events';

test('Messages produced from scheduled message are processed like normal message upon consume failures (retry, delay, requeue, etc)', async () => {
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
  const deadLetteredMessages = await getQueueDeadLetteredMessages();
  const res = await deadLetteredMessages.getMessagesAsync(defaultQueue, 0, 100);
  expect(res.totalItems).toBe(1);
  expect(typeof res.items[0].getId()).toBe('string');
  expect(res.items[0].getScheduledMessageId()).toBe(msg.getId());
  expect(res.items[0].getMessageState()?.getAttempts()).toBe(4);
});
