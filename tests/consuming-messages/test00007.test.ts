import { delay } from 'bluebird';
import { getConsumer, getProducer, untilConsumerIdle } from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';
import { ICallback } from '../../types';

test('A consumer does re-queue and consume again a failed message when threshold not exceeded', async () => {
  const producer = getProducer();
  const consumer = getConsumer();

  let callCount = 0;

  consumer.consume = jest.fn((msg: Message, cb: ICallback<void>) => {
    callCount += 1;
    if (callCount === 1) throw new Error('Explicit error');
    else if (callCount === 2) cb(null);
    else throw new Error('Unexpected call');
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
  msg.setBody({ hello: 'world' });

  await producer.produceAsync(msg);
  consumer.run();

  await delay(10000);

  await untilConsumerIdle(consumer);
  expect(unacknowledged).toBe(1);
  expect(acknowledged).toBe(1);
});
