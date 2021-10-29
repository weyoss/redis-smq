import { getConsumer, getProducer, untilConsumerEvent } from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/events';

test('A message is not lost in case of a consumer crash', async () => {
  const producer = getProducer();

  const msg = new Message();
  msg.setBody({ hello: 'world' });

  await producer.produceMessageAsync(msg);

  /**
   * Consumer1 tries to consume a message but "crushes" (stops)
   */
  const consumer1 = getConsumer({
    consumeMock: jest.fn(() => {
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
    consumeMock: jest.fn((msg, cb) => {
      cb(null);
    }),
  });

  consumer1.run();
  await untilConsumerEvent(consumer2, events.MESSAGE_ACKNOWLEDGED);
});
