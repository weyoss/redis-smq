import { Message } from '../../../index';
import { MessageState } from '../../../src/lib/message/message-state';
import { untilMessageAcknowledged } from '../../common/events';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';

test('Produce and consume 1 message', async () => {
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  await producer.runAsync();

  const consumer = getConsumer({
    messageHandler: (msg1, cb) => cb(),
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  expect(msg.getMessageState()).toBe(null);
  expect(msg.getId()).toBe(null);

  await producer.produceAsync(msg);

  expect((msg.getMessageState() ?? {}) instanceof MessageState).toBe(true);
  expect(typeof msg.getId() === 'string').toBe(true);

  consumer.run();

  await untilMessageAcknowledged(consumer, msg);
});
