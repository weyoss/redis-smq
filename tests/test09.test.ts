import { getConsumer, getProducer, untilConsumerIdle } from './common';
import { Message } from '../src/message';
import { events } from '../src/events';

test('A consumer does re-queue a failed message when threshold is not exceeded, otherwise it moves the message to DLQ (dead letter queue)', async () => {
  const producer = getProducer();
  const consumer = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      throw new Error('Explicit error');
    }),
  });

  let reQueuedCount = 0;
  consumer.on(events.MESSAGE_RETRY, () => {
    reQueuedCount += 1;
  });

  let deadCount = 0;
  consumer.on(events.MESSAGE_DEAD_LETTER, () => {
    deadCount += 1;
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' });

  await producer.produceMessageAsync(msg);
  consumer.run();

  await untilConsumerIdle(consumer);
  expect(reQueuedCount).toBe(3);
  expect(deadCount).toBe(1);
});
