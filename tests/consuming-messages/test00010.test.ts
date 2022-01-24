import {
  getConsumer,
  produceMessage,
  untilMessageAcknowledged,
} from '../common';
import { events } from '../../src/system/common/events';

test('A message is not lost in case of a consumer crash', async () => {
  await produceMessage();

  /**
   * Consumer1 tries to consume a message but "crushes" (stops)
   */
  const consumer1 = getConsumer({
    messageHandler: jest.fn(() => {
      // do not acknowledge/unacknowledge the message
      consumer1.shutdown();
    }),
  });
  consumer1.on(events.DOWN, () => {
    // once stopped, start consumer2
    consumer2.run();
  });

  /**
   * Consumer2 re-queues failed message and consume it!
   */
  const consumer2 = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      cb(null);
    }),
  });

  consumer1.run();
  await untilMessageAcknowledged(consumer2);
});
