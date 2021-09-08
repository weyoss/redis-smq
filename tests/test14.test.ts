import {
  getConsumer,
  getProducer,
  untilMessageAcknowledged,
  validateTime,
} from './common';
import { Message } from '../src/message';

describe('Produce and consume a delayed message with scheduledCRON/scheduledRepeat/scheduledPeriod parameters', () => {
  test('Case 1', async () => {
    const timestamps: number[] = [];
    const consumer = getConsumer({
      consumeMock: jest.fn((msg, cb) => {
        timestamps.push(Date.now());
        cb();
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

  test('Case 2', async () => {
    const timestamps: number[] = [];
    const consumer = getConsumer({
      consumeMock: jest.fn((msg, cb) => {
        timestamps.push(Date.now());
        cb();
      }),
    });
    consumer.run();

    const msg = new Message();
    msg.setScheduledCron('*/20 * * * * *'); // Schedule message for each 30 seconds
    msg.setScheduledRepeat(2); // repeat 2 times
    msg.setScheduledPeriod(5); // 5 secs between each repeat

    const producer = getProducer();
    await producer.produceMessageAsync(msg);

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

  test('Case 3', async () => {
    const timestamps: number[] = [];
    const consumer = getConsumer({
      consumeMock: jest.fn((msg, cb) => {
        timestamps.push(Date.now());
        cb();
      }),
    });
    consumer.run();

    const msg = new Message();
    msg.setScheduledCron('*/20 * * * * *'); // Schedule message for each 30 seconds
    msg.setScheduledRepeat(2); // repeat 2 times
    msg.setScheduledPeriod(5); // 5 secs between each repeat
    msg.setScheduledDelay(15); // this will first delay the message for 15 secs before cron/repeat scheduling
    msg.setBody({ hello: 'world' });

    const producer = getProducer();

    let producedAt = 0;
    producer.once('message.produced', () => {
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
});
