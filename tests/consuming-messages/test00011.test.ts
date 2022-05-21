import { delay } from 'bluebird';
import { createQueue, defaultQueue, getConsumer, getProducer } from '../common';
import { Message } from '../..';
import { events } from '../../src/common/events';

test('Given many consumers, a message is delivered only to one consumer', async () => {
  await createQueue(defaultQueue, false);

  const consumer1 = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      cb();
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
    messageHandler: jest.fn((msg, cb) => {
      cb();
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

  await consumer1.runAsync();
  await consumer2.runAsync();

  /**
   *
   */
  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  const producer = getProducer();
  await producer.produceAsync(msg);

  /**
   *
   */
  await delay(20000);

  /**
   *
   */
  expect(unacks1).toBe(0);
  expect(unacks2).toBe(0);
  expect(acks1 + acks2).toBe(1);
});
