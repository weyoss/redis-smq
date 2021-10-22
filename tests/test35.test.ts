import {
  getConsumer,
  getProducer,
  untilMessageAcknowledged,
  validateTime,
} from './common';
import { Message } from '../src/message';

test('Schedule a message with a CRON expression and check that it is enqueued periodically on time.', async () => {
  const timestamps: number[] = [];
  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      timestamps.push(Date.now());
      cb(null);
    }),
  });
  consumer.run();

  const msg = new Message();
  msg.setScheduledCron('*/3 * * * * *').setBody({ hello: 'world' });

  const producer = getProducer();
  await producer.produceMessageAsync(msg);

  for (let i = 0; i < 5; i += 1) {
    await untilMessageAcknowledged(consumer);
  }

  for (let i = 0; i < 5; i += 1) {
    const diff = timestamps[i] - timestamps[0];
    if (i === 0) {
      expect(validateTime(diff, 0)).toBe(true);
    } else if (i === 1) {
      expect(validateTime(diff, 3000)).toBe(true);
    } else if (i === 2) {
      expect(validateTime(diff, 6000)).toBe(true);
    } else if (i === 3) {
      expect(validateTime(diff, 9000)).toBe(true);
    } else {
      expect(validateTime(diff, 12000)).toBe(true);
    }
  }
});
