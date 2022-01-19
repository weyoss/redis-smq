import {
  defaultQueue,
  getConsumer,
  getProducer,
  untilConsumerIdle,
} from '../common';
import { Message } from '../../index';

test('Produce and consume 100 messages', async () => {
  const producer = getProducer();
  const consumer = getConsumer();

  const total = 100;
  const publishedMsg: Message[] = [];
  for (let i = 0; i < total; i += 1) {
    const msg = new Message();
    msg.setBody({ hello: 'world' }).setQueue(defaultQueue);
    await producer.produceAsync(msg);
    publishedMsg.push(msg);
  }

  const deliveredMessages: Message[] = [];
  consumer.consume = (msg, cb) => {
    deliveredMessages.push(msg);
    cb();
  };
  await consumer.runAsync();
  await untilConsumerIdle(consumer);

  expect(deliveredMessages.length).toEqual(publishedMsg.length);
  for (let i = 0; i < total; i += 1) {
    expect(publishedMsg[i].getId()).toStrictEqual(
      deliveredMessages[total - i - 1].getId(),
    );
  }
});
