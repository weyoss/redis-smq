import {
  createQueue,
  defaultQueue,
  getConsumer,
  getProducer,
  untilMessageAcknowledged,
} from '../common';
import { Message } from '../../index';
import { MessageMetadata } from '../../src/lib/message/message-metadata';

test('Produce and consume 1 message', async () => {
  await createQueue(defaultQueue, false);
  const producer = getProducer();
  const consumer = getConsumer({
    messageHandler: (msg1, cb) => cb(),
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  expect(msg.getMetadata()).toBe(null);
  expect(msg.getId()).toBe(null);

  await producer.produceAsync(msg);

  expect((msg.getMetadata() ?? {}) instanceof MessageMetadata).toBe(true);
  expect(typeof msg.getId() === 'string').toBe(true);

  consumer.run();

  await untilMessageAcknowledged(consumer, msg);
});
