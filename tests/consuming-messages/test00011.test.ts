import { delay } from 'bluebird';
import { getConsumer, getProducer, untilConsumerIdle } from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';

test('A message is delivered only once to one consumer', async () => {
  const consumer1 = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      cb(null);
    }),
  });
  let unacks1 = 0;
  let acks1 = 0;
  consumer1
    .on(events.MESSAGE_UNACKNOWLEDGED, () => {
      unacks1 += 1;
    })
    .on(events.MESSAGE_ACKNOWLEDGED, () => {
      acks1 += 1;
    });

  /**
   *
   */
  const consumer2 = getConsumer({
    consumeMock: jest.fn((msg, cb) => {
      cb(null);
    }),
  });
  let unacks2 = 0;
  let acks2 = 0;
  consumer2
    .on(events.MESSAGE_UNACKNOWLEDGED, () => {
      unacks2 += 1;
    })
    .on(events.MESSAGE_ACKNOWLEDGED, () => {
      acks2 += 1;
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
  expect(unacks1).toBe(0);
  expect(unacks2).toBe(0);
  expect(acks1 + acks2).toBe(1);
});
