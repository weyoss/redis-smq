import { events } from '../../../src/common/events/events';
import {
  createQueue,
  defaultQueue,
  produceMessage,
} from '../../common/message-producing-consuming';
import { untilMessageAcknowledged } from '../../common/events';
import { getConsumer } from '../../common/consumer';

test('A message is not lost in case of a consumer crash', async () => {
  await createQueue(defaultQueue, false);

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
      cb();
    }),
  });

  consumer1.run();
  await untilMessageAcknowledged(consumer2);
});
