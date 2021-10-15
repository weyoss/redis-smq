import {
  getConsumer,
  getProducer,
  untilConsumerIdle,
  untilMessageAcknowledged,
  validateTime,
} from './common';
import { Message } from '../src/message';
import { events } from '../src/system/events';

test('A consumer delays a failed message before re-queuing it again, given messageRetryThreshold is not exceeded', async () => {
  const timestamps: number[] = [];
  let callCount = 0;
  const consumer = getConsumer({
    queueName: 'test_queue',
    options: { messageRetryDelay: 10, messageRetryThreshold: 5 },
    consumeMock: jest.fn((msg, cb) => {
      timestamps.push(Date.now());
      callCount += 1;
      if (callCount < 5) {
        throw new Error('Explicit error');
      } else if (callCount === 5) {
        cb();
      } else throw new Error('Unexpected call');
    }),
  });

  let delayedCount = 0;
  consumer.on(events.MESSAGE_RETRY_AFTER_DELAY, () => {
    delayedCount += 1;
  });

  let consumedCount = 0;
  consumer.on(events.MESSAGE_ACKNOWLEDGED, () => {
    consumedCount += 1;
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const producer = getProducer('test_queue');
  await producer.produceMessageAsync(msg);
  consumer.run();

  await untilMessageAcknowledged(consumer);

  await untilConsumerIdle(consumer);
  expect(delayedCount).toBe(4);
  expect(consumedCount).toBe(1);

  for (let i = 0; i < timestamps.length; i += 1) {
    const diff = timestamps[i] - timestamps[0];
    if (i === 0) {
      expect(validateTime(diff, 0)).toBe(true);
    } else if (i === 1) {
      expect(validateTime(diff, 10000)).toBe(true);
    } else if (i === 2) {
      expect(validateTime(diff, 20000)).toBe(true);
    } else if (i === 3) {
      expect(validateTime(diff, 30000)).toBe(true);
    } else {
      expect(validateTime(diff, 40000)).toBe(true);
    }
  }
});
