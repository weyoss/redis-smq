import { delay, promisifyAll } from 'bluebird';
import { Consumer } from '../../src/consumer';
import {
  createQueue,
  defaultQueue,
  getProducer,
  getQueueManager,
} from '../common';
import { Message } from '../../src/app/message/message';

test('Consume messages from different queues using a single consumer instance: case 5', async () => {
  await createQueue(defaultQueue, false);

  const qm = await getQueueManager();
  await qm.queueRateLimit.setAsync(defaultQueue, {
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

  await consumer.shutdownAsync();
});
