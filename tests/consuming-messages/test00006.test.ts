import {
  createQueue,
  defaultQueue,
  getConsumer,
  getProducer,
  untilConsumerEvent,
} from '../common';
import { Message } from '../../src/lib/message/message';
import { events } from '../../src/common/events/events';
import { ICallback } from 'redis-smq-common/dist/types';

test('A message is unacknowledged when messageConsumeTimeout is exceeded', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();
  let consumeCount = 0;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg: unknown, cb: ICallback<void>) => {
      if (consumeCount === 0) setTimeout(cb, 5000);
      else if (consumeCount === 1) cb();
      else throw new Error('Unexpected call');
      consumeCount += 1;
    }),
  });

  const msg = new Message();
  msg
    .setBody({ hello: 'world' })
    .setQueue(defaultQueue)
    .setConsumeTimeout(2000)
    .setRetryDelay(6000);

  await producer.produceAsync(msg);
  consumer.run();
  await untilConsumerEvent(consumer, events.MESSAGE_UNACKNOWLEDGED);
  await untilConsumerEvent(consumer, events.MESSAGE_ACKNOWLEDGED);
});
