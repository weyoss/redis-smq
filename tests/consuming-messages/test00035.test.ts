import { delay, promisifyAll } from 'bluebird';
import { Consumer } from '../../src/lib/consumer/consumer';
import { getProducer, getQueueManager } from '../common';
import { Message } from '../../src/lib/message/message';
import { events } from '../../src/common/events/events';
import { config } from '../config';

test('Consume messages from different queues using a single consumer instance: case 6', async () => {
  const qm = await getQueueManager();

  const messages: Message[] = [];
  const consumer = promisifyAll(new Consumer(config, true));
  await consumer.runAsync();

  // running without message handlers
  await delay(5000);

  await qm.queue.createAsync('test0', false);
  await consumer.consumeAsync('test0', () => void 0);

  consumer.once(events.MESSAGE_RECEIVED, () => {
    setTimeout(() => {
      // cancelling a queue when a message handler is active
      consumer.cancelAsync('test0').catch((e: unknown) => {
        console.log(e);
      });
    }, 1000);
  });

  const producer = getProducer();
  await producer.produceAsync(new Message().setQueue('test0').setBody('body'));

  await delay(10000);
  expect(consumer.getQueues()).toEqual([]);

  await qm.queue.createAsync('test1', true);
  await consumer.consumeAsync('test1', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await qm.queue.createAsync('test2', true);
  await consumer.consumeAsync('test2', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await qm.queue.createAsync('test3', true);
  await consumer.consumeAsync('test3', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await qm.queue.createAsync('test4', true);
  await consumer.consumeAsync('test4', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await qm.queue.createAsync('test5', true);
  await consumer.consumeAsync('test5', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  for (let i = 0; i < 5; i += 1) {
    await producer.produceAsync(
      new Message()
        .setQueue(`test${i + 1}`)
        .setBody(`body ${i + 1}`)
        .setPriority(i),
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
