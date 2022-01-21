import {
  defaultQueue,
  getConsumer,
  getProducer,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../index';

test('Produce and consume 1 message', async () => {
  const producer = getProducer();

  const messageHandler = jest.fn();
  const consumer = getConsumer({
    messageHandler,
  });

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  consumer.run();

  await untilConsumerIdle(consumer);
  const receivedMsg = messageHandler.mock.calls[0][0];
  expect(receivedMsg.getId()).toStrictEqual(msg.getId());
  expect(receivedMsg.getBody()).toStrictEqual({ hello: 'world' });
  expect(messageHandler).toHaveBeenCalledTimes(1);
});
