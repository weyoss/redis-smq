import {
  defaultQueue,
  getConsumer,
  getProducer,
  untilConsumerIdle,
  untilMessageAcknowledged,
  validateTime,
} from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';
import { config } from '../config';

test('A consumer delays a failed message before re-queuing it again, given messageRetryThreshold is not exceeded', async () => {
  const timestamps: number[] = [];
  let callCount = 0;
  const consumer = getConsumer({
    cfg: {
      ...config,
      message: { retryDelay: 10000, retryThreshold: 5 },
    },
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

  // DelayWorker's ticker runs at each 1000 ms, to schedule delayed messages
  // An additional 1000ms is taken for each iteration
  for (let i = 0; i < timestamps.length; i += 1) {
    const diff = timestamps[i] - timestamps[0];
    if (i === 0) {
      expect(validateTime(diff, 0)).toBe(true);
    } else if (i === 1) {
      expect(validateTime(diff, 11000)).toBe(true);
    } else if (i === 2) {
      expect(validateTime(diff, 22000)).toBe(true);
    } else if (i === 3) {
      expect(validateTime(diff, 33000)).toBe(true);
    } else {
      expect(validateTime(diff, 44000)).toBe(true);
    }
  }
});
