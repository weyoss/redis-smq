import { getConsumer, getProducer, untilConsumerIdle } from '../common';
import { Message } from '../../index';

test('Produce and consume 100 messages', async () => {
  const producer = getProducer();
  const consumer = getConsumer();
  const consume = jest.spyOn(consumer, 'consume');
  consumer.run();

  const total = 100;
  const publishedMsg: Message[] = [];
  for (let i = 0; i < total; i += 1) {
    const msg = new Message();
    msg.setBody({ hello: 'world' });
    await producer.produceMessageAsync(msg);
    publishedMsg.push(msg);
  }

  await untilConsumerIdle(consumer);

  expect(consume).toHaveBeenCalledTimes(total);
  expect(publishedMsg[0].getId()).toStrictEqual(
    consume.mock.calls[total - 1][0].getId(),
  );
  expect(publishedMsg[0].getBody()).toStrictEqual(
    consume.mock.calls[total - 1][0].getBody(),
  );
});
