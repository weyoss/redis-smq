import {
  defaultQueue,
  getConsumer,
  getProducer,
  mockConfiguration,
  untilConsumerIdle,
  untilMessageAcknowledged,
  validateTime,
} from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';

test('A consumer delays a failed message before re-queuing it again, given messageRetryThreshold is not exceeded', async () => {
  mockConfiguration({
    message: { retryDelay: 10000, retryThreshold: 5 },
  });
  const timestamps: number[] = [];
  let callCount = 0;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      timestamps.push(Date.now());
      callCount += 1;
      if (callCount < 5) {
        throw new Error('Explicit error');
      } else if (callCount === 5) {
        cb();
      } else throw new Error('Unexpected call');
    }),
  });

  let unacks = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacks += 1;
  });

  let acks = 0;
  consumer.on(events.MESSAGE_ACKNOWLEDGED, () => {
    acks += 1;
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  const producer = getProducer();
  await producer.produceAsync(msg);
  consumer.run();

  await untilMessageAcknowledged(consumer);
  await untilConsumerIdle(consumer);

  expect(unacks).toBe(4);
  expect(acks).toBe(1);

  for (let i = 0; i < timestamps.length; i += 1) {
    const diff = timestamps[i] - timestamps[0];
    if (i === 0) {
      expect(validateTime(diff, 0)).toBe(true);
    } else if (i === 1) {
      // adjusted
      expect(validateTime(diff, 16000)).toBe(true);
    } else if (i === 2) {
      // adjusted
      expect(validateTime(diff, 31000)).toBe(true);
    } else if (i === 3) {
      // adjusted
      expect(validateTime(diff, 46000)).toBe(true);
    } else {
      // adjusted
      expect(validateTime(diff, 61000)).toBe(true);
    }
  }
});
