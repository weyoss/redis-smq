import { Message } from '../../../index';
import { delay } from 'bluebird';
import { getConsumer } from '../../common/consumer';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { EQueueType } from '../../../types';

test('Produce and consume 100 message: LIFO Queues', async () => {
  await createQueue(defaultQueue, EQueueType.LIFO_QUEUE);

  const producer = await getProducer();
  await producer.runAsync();

  const total = 100;
  const publishedMsg: Message[] = [];
  for (let i = 0; i < total; i += 1) {
    const msg = new Message();
    msg.setBody({ hello: 'world' }).setQueue(defaultQueue);
    await producer.produceAsync(msg);
    publishedMsg.push(msg);
  }

  const deliveredMessages: Message[] = [];
  const consumer = getConsumer({
    messageHandler: (msg, cb) => {
      deliveredMessages.push(msg);
      cb();
    },
  });
  await consumer.runAsync();
  await delay(20000);

  expect(deliveredMessages.length).toEqual(publishedMsg.length);
  for (let i = 0; i < total; i += 1) {
    expect(publishedMsg[i].getRequiredId()).toStrictEqual(
      deliveredMessages[total - i - 1].getRequiredId(),
    );
  }
});
