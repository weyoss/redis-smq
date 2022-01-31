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

test('A message is delayed before being re-queued, given messageRetryDelay > 0 and messageRetryThreshold > 0 and is not exceeded', async () => {
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

  // consumer workers are run each ~ 5 sec
  for (let i = 0; i < timestamps.length; i += 1) {
    if (i === 0) {
      continue;
    }
    const diff = timestamps[i] - timestamps[i - 1];
    if (i === 1) {
      expect(validateTime(diff, 15000)).toBe(true);
    } else if (i === 2) {
      expect(validateTime(diff, 15000)).toBe(true);
    } else if (i === 3) {
      expect(validateTime(diff, 15000)).toBe(true);
    } else {
      expect(validateTime(diff, 15000)).toBe(true);
    }
  }
});
