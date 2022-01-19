import {
  defaultQueue,
  getConsumer,
  getMessageManagerFrontend,
  getProducer,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../src/message';
import { events } from '../../src/system/common/events';
import { promisifyAll } from 'bluebird';

test('A consumer does re-queue a failed message when threshold is not exceeded, otherwise it moves the message to DLQ (dead letter queue)', async () => {
  const producer = getProducer();
  const consumer = getConsumer({
    consumeMock: jest.fn(() => {
      throw new Error('Explicit error');
    }),
  });

  let unacknowledged = 0;
  consumer.on(events.MESSAGE_UNACKNOWLEDGED, () => {
    unacknowledged += 1;
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  consumer.run();

  await untilConsumerIdle(consumer);
  expect(unacknowledged).toBe(3);

  const m = promisifyAll(await getMessageManagerFrontend());
  const list = await m.getDeadLetterMessagesAsync(defaultQueue, 0, 100);
  expect(list.total).toBe(1);
  expect(list.items[0].message.getId()).toBe(msg.getId());
});
