import {
  createQueue,
  defaultQueue,
  getConsumer,
  getProducer,
  untilMessageAcknowledged,
} from '../common';
import { Message } from '../../index';
import { ICallback, TConsumerMessageHandler } from '../../types';
import { MessageMetadata } from '../../src/lib/message/message-metadata';

test('Produce and consume 1 message', async () => {
  await createQueue(defaultQueue, false);

  const producer = getProducer();

  const messageHandler: jest.Mock<
    TConsumerMessageHandler,
    [Message, ICallback<void>]
  > = jest.fn();
  const consumer = getConsumer({
    messageHandler,
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
  const receivedMsg = messageHandler.mock.calls[0][0];
  expect(receivedMsg.getRequiredId()).toStrictEqual(msg.getRequiredId());
  expect(receivedMsg.getBody()).toStrictEqual({ hello: 'world' });
  expect(messageHandler).toHaveBeenCalledTimes(1);
});
