import {
  getConsumer,
  getProducer,
  untilConsumerIdle,
  untilMessageAcknowledged,
  validateTime,
} from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';

test('Produce and consume a delayed message: Case 2', async () => {
  let producedAt = 0;
  let callCount = 0;

  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      callCount += 1;
      if (callCount > 1) throw new Error('Unexpected call');
      cb(null);
    }),
  });
  consumer.run();

  const msg = new Message();
  msg
    .setScheduledDelay(10000)
    .setScheduledRepeat(0) // should not be repeated
    .setScheduledPeriod(3000)
    .setBody({ hello: 'world' });

  const producer = getProducer();
  producer.once(events.MESSAGE_PRODUCED, () => {
    producedAt = Date.now();
  });
  await producer.produceMessageAsync(msg);

  await untilMessageAcknowledged(consumer);
  const diff = Date.now() - producedAt;
  expect(validateTime(diff, 10000)).toBe(true);

  await untilConsumerIdle(consumer);
});
