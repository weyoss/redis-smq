import { getConsumer, getProducer, untilConsumerIdle } from './common';
import { Message } from '../index';
import { delay } from 'bluebird';

test('Produce and consume 1 expired message', async () => {
  const producer = getProducer();
  const consumer = getConsumer();
  const expired = jest.spyOn(consumer, 'expired');

  const msg = new Message();
  msg.setBody({ hello: 'world' }).setTTL(2000);

  await producer.produceMessageAsync(msg);
  await delay(5000);
  consumer.run();

  await untilConsumerIdle(consumer);
  const expiredMsg = expired.mock.calls[0][0];
  expect(expiredMsg.getId()).toStrictEqual(msg.getId());
  expect(expiredMsg.getBody()).toStrictEqual({ hello: 'world' });
  expect(expired).toHaveBeenCalledTimes(1);

});
