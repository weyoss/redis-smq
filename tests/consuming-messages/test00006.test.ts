import {
  defaultQueue,
  getConsumer,
  getProducer,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';
import { ICallback } from '../../types';
import { config } from '../config';

test('When consuming a message, a consumer does time out after messageConsumeTimeout exceeds and re-queues the message to be consumed again', async () => {
  const producer = getProducer();

  let consumeCount = 0;
  const consumer = getConsumer({
    cfg: {
      ...config,
      message: {
        consumeTimeout: 2000,
      },
    },
    consumeMock: jest.fn((msg: unknown, cb: ICallback<void>) => {
      if (consumeCount === 0) setTimeout(cb, 5000);
      else if (consumeCount === 1) cb(null);
      else throw new Error('Unexpected call');
      consumeCount += 1;
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

  await untilConsumerIdle(consumer);
  expect(unacknowledged).toBe(1);
  expect(acknowledged).toBe(1);
});
