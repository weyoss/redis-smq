import { delay, promisifyAll } from 'bluebird';
import { Consumer } from '../../../src/lib/consumer/consumer';
import { Message } from '../../../src/lib/message/message';
import { getProducer } from '../../common/producer';
import {
  createQueue,
  defaultQueue,
} from '../../common/message-producing-consuming';
import { shutDownBaseInstance } from '../../common/base-instance';
import { getQueueRateLimit } from '../../common/queue-rate-limit';

test('Consume message from different queues using a single consumer instance: case 5', async () => {
  await createQueue(defaultQueue, false);

  const queueRateLimit = await getQueueRateLimit();
  await queueRateLimit.setAsync(defaultQueue, {
    limit: 3,
    interval: 5000,
  });

  const messages: Message[] = [];
  const consumer = promisifyAll(new Consumer(true));

  await consumer.consumeAsync(defaultQueue, (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await consumer.runAsync();

  const producer = getProducer();
  await producer.runAsync();

  for (let i = 0; i < 5; i += 1) {
    await producer.produceAsync(
      new Message().setQueue(defaultQueue).setBody(`body ${i + 1}`),
    );
  }

  await delay(10000);
  expect(messages.length).toBe(5);
  expect(messages.map((i) => i.getBody()).sort()).toEqual([
    'body 1',
    'body 2',
    'body 3',
    'body 4',
    'body 5',
  ]);

  await shutDownBaseInstance(consumer);
});
