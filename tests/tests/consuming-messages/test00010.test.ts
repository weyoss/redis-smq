import {
  crashAConsumerConsumingAMessage,
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { untilMessageAcknowledged } from '../../common/events';
import { getConsumer } from '../../common/consumer';

test('A message is not lost in case of a consumer crash', async () => {
  await createQueue(defaultQueue, false);
  await crashAConsumerConsumingAMessage();

  /**
   * Consumer2 re-queues failed message and consume it!
   */
  const consumer2 = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      cb();
    }),
  });
  consumer2.run();
  await untilMessageAcknowledged(consumer2);
});
