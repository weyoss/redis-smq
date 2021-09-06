import { getConsumer, getProducer, untilConsumerIdle } from './common';
import { Message } from '../index';

test('Produce and consume 100 messages', async () => {
  const producer = getProducer();
  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');
  consumer.run();

  const publishedMsg: Message[] = [];
  for (let i = 0; i < 100; i += 1) {
    const msg = new Message();
    msg.setBody({ hello: 'world' });
    await producer.produceMessageAsync(msg);
    publishedMsg.push(msg);
  }

  await untilConsumerIdle(consumer);
  expect(consume).toHaveBeenCalledTimes(100);
  expect(consume.mock.calls[0][0].getId()).toStrictEqual(
    publishedMsg[0].getId(),
  );
  expect(consume.mock.calls[0][0].getBody()).toStrictEqual(
    publishedMsg[0].getBody(),
  );
});
