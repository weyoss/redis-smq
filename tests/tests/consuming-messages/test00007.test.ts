import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { ICallback } from 'redis-smq-common/dist/types';
import { untilMessageAcknowledged } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

test('Unacknowledged messages are re-queued when messageRetryThreshold is not exceeded', async () => {
  const producer = getProducer();
  await createQueue(defaultQueue, false);

  let callCount = 0;
  const consumer = getConsumer({
    messageHandler: jest.fn((msg: Message, cb: ICallback<void>) => {
      callCount += 1;
      if (callCount === 1) throw new Error('Explicit error');
      else if (callCount === 2) cb();
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

  await untilMessageAcknowledged(consumer);

  expect(unacknowledged).toBe(1);
  expect(acknowledged).toBe(1);
});
