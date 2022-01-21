import {
  defaultQueue,
  getConsumer,
  getProducer,
  untilMessageAcknowledged,
  validateTime,
} from '../common';
import { Message } from '../../src/message';

test('Produce and consume a delayed message: Case 2', async () => {
  let callCount = 0;
  const timestamps: number[] = [];
  const consumer = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      callCount += 1;
      if (callCount > 1) throw new Error('Unexpected call');
      timestamps.push(msg.getPublishedAt() ?? 0);
      cb();
    }),
  });
  consumer.run();

  const msg = new Message();
  msg
    .setScheduledDelay(10000)
    .setScheduledRepeat(0) // should not be repeated
    .setScheduledPeriod(3000)
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await untilMessageAcknowledged(consumer);
  const diff = (timestamps[0] ?? 0) - producedAt;
  expect(validateTime(diff, 10000)).toBe(true);
});
