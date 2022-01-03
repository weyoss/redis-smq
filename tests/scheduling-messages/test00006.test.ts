import {
  getConsumer,
  getProducer,
  untilConsumerIdle,
  untilMessageAcknowledged,
  validateTime,
} from '../common';
import { Message } from '../../src/message';
import { delay } from 'bluebird';

test('Produce and consume a delayed message: Case 1', async () => {
  let callCount = 0;
  const timestamps: number[] = [];
  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      callCount += 1;
      if (callCount > 3) {
        throw new Error('Unexpected call');
      }
      timestamps.push(msg.getPublishedAt() ?? 0);
      cb();
    }),
  });
  consumer.run();

  const msg = new Message();
  msg
    .setScheduledDelay(10000)
    .setScheduledRepeat(3)
    .setScheduledPeriod(3000)
    .setBody({ hello: 'world' });

  const producer = getProducer();
  await producer.produceAsync(msg);
  const producedAt = Date.now();

  await untilMessageAcknowledged(consumer);
  await untilMessageAcknowledged(consumer);
  await untilMessageAcknowledged(consumer);

  await delay(6000); // just to make sure no more messages are published

  const diff1 = (timestamps[0] ?? 0) - producedAt;
  expect(validateTime(diff1, 10000)).toBe(true);

  const diff2 = (timestamps[1] ?? 0) - producedAt;
  expect(validateTime(diff2, 13000)).toBe(true);

  const diff3 = (timestamps[2] ?? 0) - producedAt;
  expect(validateTime(diff3, 16000)).toBe(true);

  await untilConsumerIdle(consumer);
  expect(timestamps.length).toEqual(3);
});
