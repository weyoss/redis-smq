import {
  createQueue,
  defaultQueue,
  getConsumer,
  getProducer,
  mockConfiguration,
  untilConsumerEvent,
} from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';
import { ICallback } from '../../types';

test('A message is unacknowledged when messageConsumeTimeout is exceeded', async () => {
  mockConfiguration({
    message: {
      consumeTimeout: 2000,
      retryDelay: 6000,
    },
  });
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  let consumeCount = 0;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg: unknown, cb: ICallback<void>) => {
      if (consumeCount === 0) setTimeout(cb, 5000);
      else if (consumeCount === 1) cb(null);
      else throw new Error('Unexpected call');
      consumeCount += 1;
    }),
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  consumer.run();
  await untilConsumerEvent(consumer, events.MESSAGE_UNACKNOWLEDGED);
  await untilConsumerEvent(consumer, events.MESSAGE_ACKNOWLEDGED);
});
