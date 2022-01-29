import {
  defaultQueue,
  getConsumer,
  getProducer,
  untilMessageAcknowledged,
  validateTime,
} from '../common';
import { Message } from '../../src/message';

test('Schedule a message with a CRON expression and check that it is enqueued periodically on time.', async () => {
  const timestamps: number[] = [];
  const consumer = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      timestamps.push(msg.getPublishedAt() ?? 0);
      cb(null);
    }),
  });
  consumer.run();

  const msg = new Message();
  msg
    .setScheduledCron('*/3 * * * * *')
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue);

  const producer = getProducer();
  await producer.produceAsync(msg);

  for (let i = 0; i < 5; i += 1) {
    await untilMessageAcknowledged(consumer);
  }

  for (let i = 0; i < 5; i += 1) {
    const diff = timestamps[i] - timestamps[0];
    if (i === 0) {
      // adjusted
      expect(validateTime(diff, 0)).toBe(true);
    } else if (i === 1) {
      // adjusted
      expect(validateTime(diff, 5000)).toBe(true);
    } else if (i === 2) {
      // adjusted
      expect(validateTime(diff, 10000)).toBe(true);
    } else if (i === 3) {
      // adjusted
      expect(validateTime(diff, 15000)).toBe(true);
    } else {
      // adjusted
      expect(validateTime(diff, 20000)).toBe(true);
    }
  }
});
