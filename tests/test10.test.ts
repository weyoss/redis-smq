import { getConsumer, getProducer, untilConsumerEvent } from './common';
import { Message } from '../src/message';
import { events } from '../src/events';

test('A message is not lost in case of a consumer crash', async () => {
  const producer = getProducer();

  const msg = new Message();
  msg.setBody({ hello: 'world' });

  await producer.produceMessageAsync(msg);

  /**
   * Consumer1 tries to consume a message but "crushes" (stops)
   */
  const consumer1 = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
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
      cb();
    }),
  });

  let messageRequeued = false;
  consumer2.on(events.GC_MESSAGE_REQUEUED, () => {
    messageRequeued = true;
  });

  let messageAcknowledged = false;
  consumer2.on(events.GC_MESSAGE_REQUEUED, () => {
    messageAcknowledged = true;
  });

  consumer1.run();

  await untilConsumerEvent(consumer2, events.GC_LOCK_ACQUIRED);
  await untilConsumerEvent(consumer2, events.IDLE);
  expect(messageRequeued).toBe(true);
  expect(messageAcknowledged).toBe(true);
});
