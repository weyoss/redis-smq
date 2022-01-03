import {
  getConsumer,
  getProducer,
  untilConsumerIdle,
  untilMessageAcknowledged,
  validateTime,
} from '../common';
import { Message } from '../../src/message';

test('Produce and consume a delayed message', async () => {
  const consumedMessages: Message[] = [];
  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      consumedMessages.push(msg);
      cb();
    }),
  });
  consumer.run();

  const msg = new Message();
  msg.setScheduledDelay(10000).setBody({ hello: 'world' }); // seconds

  const producer = getProducer();
  await producer.produceAsync(msg);

  await untilMessageAcknowledged(consumer);
  await untilConsumerIdle(consumer);

  const [message] = consumedMessages;
  const diff =
    (message.getPublishedAt() ?? 0) - (message.getScheduledAt() ?? 0);
  expect(validateTime(diff, 10000)).toBe(true);
});
