import {
  defaultQueue,
  getConsumer,
  getMessageManager,
  getProducer,
  untilConsumerEvent,
} from '../common';
import { Message } from '../../src/system/app/message/message';
import { events } from '../../src/system/common/events';

test('Shutdown a consumer when consuming a message with retryThreshold = 0: expect the message to be dead-lettered', async () => {
  const consumer = getConsumer({
    messageHandler: jest.fn(() => {
      consumer.shutdown();
    }),
  });

  const msg = new Message()
    .setRetryThreshold(0)
    .setBody('message body')
    .setQueue(defaultQueue);
  const producer = getProducer();
  await producer.produceAsync(msg);

  consumer.run();
  await untilConsumerEvent(consumer, events.DOWN);
  const messageManager = await getMessageManager();
  const res = await messageManager.deadLetteredMessages.listAsync(
    defaultQueue,
    0,
    99,
  );
  expect(res.total).toBe(1);
  expect(typeof res.items[0].message.getId()).toBe('string');
  expect(res.items[0].message.getId()).toBe(msg.getId());
});
