import {
  getConsumer,
  getProducer,
  untilMessageAcknowledged,
  validateTime,
} from './common';
import { Message } from '../src/message';
import { events } from '../src/system/events';

test('Schedule a message with a combination of CRON expression, repeat, period, and delay parameters. Check that it is enqueued periodically on time.', async () => {
  const timestamps: number[] = [];
  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      timestamps.push(Date.now());
      cb(null);
    }),
  });
  consumer.run();

  const msg = new Message();
  msg.setScheduledCron('*/20 * * * * *'); // Schedule message for each 30 seconds
  msg.setScheduledRepeat(2); // repeat 2 times
  msg.setScheduledPeriod(5000); // 5 secs between each repeat
  msg.setScheduledDelay(15000); // this will first delay the message for 15 secs before cron/repeat scheduling
  msg.setBody({ hello: 'world' });

  const producer = getProducer();

  let producedAt = 0;
  producer.once(events.MESSAGE_PRODUCED, () => {
    producedAt = Date.now();
  });
  await producer.produceMessageAsync(msg);

  for (let i = 0; i < 8; i += 1) {
    await untilMessageAcknowledged(consumer);
  }

  for (let i = 0; i < 8; i += 1) {
    if (i === 0) {
      // verify that the message was first delayed
      const diff = timestamps[i] - producedAt;
      expect(validateTime(diff, 15000)).toBe(true);
      continue;
    }

    if (i === 1) {
      // we can't predict the timestamps[1] - timestamps[0]
      // considering that the first message is delayed
      continue;
    }

    const diff = timestamps[i] - timestamps[1];

    if (i === 2) {
      expect(validateTime(diff, 5000)).toBe(true);
    } else if (i === 3) {
      expect(validateTime(diff, 10000)).toBe(true);
    } else if (i === 4) {
      expect(validateTime(diff, 20000)).toBe(true);
    } else if (i === 5) {
      expect(validateTime(diff, 25000)).toBe(true);
    } else if (i === 6) {
      expect(validateTime(diff, 30000)).toBe(true);
    } else if (i === 7) {
      expect(validateTime(diff, 40000)).toBe(true);
    }
  }
});
