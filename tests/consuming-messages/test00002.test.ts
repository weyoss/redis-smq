import {
  defaultQueue,
  getConsumer,
  getProducer,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../index';

test('Produce and consume 1 message', async () => {
  const producer = getProducer();
  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setQueue(defaultQueue);

  await producer.produceAsync(msg);
  consumer.run();

  await untilConsumerIdle(consumer);
  const receivedMsg = consume.mock.calls[0][0];
  expect(receivedMsg.getId()).toStrictEqual(msg.getId());
  expect(receivedMsg.getBody()).toStrictEqual({ hello: 'world' });
  expect(consume).toHaveBeenCalledTimes(1);
});
