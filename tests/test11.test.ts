import { delay } from 'bluebird';
import { getConsumer, getProducer, untilConsumerIdle } from './common';
import { Message } from '../src/message';
import { events } from '../src/events';

test('A message is delivered only once to one consumer', async () => {
  const consumer1 = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      cb();
    }),
  });
  let reQueuedCount1 = 0;
  let consumedCount1 = 0;
  consumer1
    .on(events.GC_MESSAGE_REQUEUED, () => {
      reQueuedCount1 += 1;
    })
    .on(events.MESSAGE_ACKNOWLEDGED, () => {
      consumedCount1 += 1;
    });

  /**
   *
   */
  const consumer2 = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      cb();
    }),
  });
  let reQueuedCount2 = 0;
  let consumedCount2 = 0;
  consumer2
    .on(events.GC_MESSAGE_REQUEUED, () => {
      reQueuedCount2 += 1;
    })
    .on(events.MESSAGE_ACKNOWLEDGED, () => {
      consumedCount2 += 1;
    });

  /**
   *
   */
  consumer1.run();
  consumer2.run();

  /**
   *
   */
  await untilConsumerIdle(consumer1);
  await untilConsumerIdle(consumer2);

  /**
   *
   */
  const msg = new Message();
  msg.setBody({ hello: 'world' });

  const producer = getProducer();
  await producer.produceMessageAsync(msg);

  /**
   *
   */
  await delay(10000);

  /**
   *
   */
  await untilConsumerIdle(consumer1);
  await untilConsumerIdle(consumer2);

  /**
   *
   */
  expect(reQueuedCount1).toBe(0);
  expect(reQueuedCount2).toBe(0);
  expect(consumedCount1 + consumedCount2).toBe(1);
});
