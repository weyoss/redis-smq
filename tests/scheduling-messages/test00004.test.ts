import {
  defaultQueue,
  getConsumer,
  getProducer,
  untilMessageAcknowledged,
  validateTime,
} from '../common';
import { Message } from '../../src/message';

test('Schedule a message with a combination of CRON expression, repeat and period parameters. Check that it is enqueued periodically on time.', async () => {
  const timestamps: number[] = [];
  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      timestamps.push(msg.getPublishedAt() ?? 0);
      cb(null);
    }),
  });
  consumer.run();

  const msg = new Message();
  msg.setScheduledCron('*/20 * * * * *'); // Schedule message for each 30 seconds
  msg.setScheduledRepeat(2); // repeat 2 times
  msg.setScheduledPeriod(5000); // 5 secs between each repeat
  msg.setQueue(defaultQueue);
  const producer = getProducer();
  await producer.produceAsync(msg);

  for (let i = 0; i < 7; i += 1) {
    await untilMessageAcknowledged(consumer);
  }

  for (let i = 0; i < 7; i += 1) {
    const diff = timestamps[i] - timestamps[0];
    if (i === 0) {
      expect(validateTime(diff, 0)).toBe(true);
    } else if (i === 1) {
      expect(validateTime(diff, 5000)).toBe(true);
    } else if (i === 2) {
      expect(validateTime(diff, 10000)).toBe(true);
    } else if (i === 3) {
      expect(validateTime(diff, 20000)).toBe(true);
    } else if (i === 4) {
      expect(validateTime(diff, 25000)).toBe(true);
    } else if (i === 5) {
      expect(validateTime(diff, 30000)).toBe(true);
    } else if (i === 6) {
      expect(validateTime(diff, 40000)).toBe(true);
    }
  }
});
