import { defaultQueue, getConsumer, getProducer } from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';
import { delay } from 'bluebird';

test('Async exceptions are caught when consuming a message', async () => {
  const producer = getProducer();

  let callCount = 0;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg, cb) => {
      callCount += 1;
      if (callCount === 1) {
        setTimeout(() => {
          cb(new Error('Async error'));
        }, 2000);
      } else if (callCount === 2) cb(null);
      else throw new Error('Unexpected call');
    }),
  });

  let unacknowledged = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacknowledged += 1;
  });

  let acknowledged = 0;
  consumer.on(events.MESSAGE_ACKNOWLEDGED, () => {
    acknowledged += 1;
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  consumer.run();

  await delay(15000);
  expect(unacknowledged).toBe(1);
  expect(acknowledged).toBe(1);
});
