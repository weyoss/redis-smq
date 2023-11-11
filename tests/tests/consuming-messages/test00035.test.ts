import { delay, promisifyAll } from 'bluebird';
import { Consumer } from '../../../src/lib/consumer/consumer';
import { Message } from '../../../src/lib/message/message';
import { events } from '../../../src/common/events/events';
import { getProducer } from '../../common/producer';
import { shutDownBaseInstance } from '../../common/base-instance';
import { EQueueType } from '../../../types';
import { getQueue } from '../../common/queue';

test('Consume message from different queues using a single consumer instance: case 6', async () => {
  const messages: Message[] = [];
  const consumer = promisifyAll(new Consumer(true));
  await consumer.runAsync();

  // running without message handlers
  await delay(5000);

  const queue = await getQueue();
  await queue.saveAsync('test0', EQueueType.LIFO_QUEUE);
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
  await producer.runAsync();

  await producer.produceAsync(new Message().setQueue('test0').setBody('body'));

  await delay(10000);
  expect(consumer.getQueues()).toEqual([]);

  await queue.saveAsync('test1', EQueueType.PRIORITY_QUEUE);
  await consumer.consumeAsync('test1', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await queue.saveAsync('test2', EQueueType.PRIORITY_QUEUE);
  await consumer.consumeAsync('test2', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await queue.saveAsync('test3', EQueueType.PRIORITY_QUEUE);
  await consumer.consumeAsync('test3', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await queue.saveAsync('test4', EQueueType.PRIORITY_QUEUE);
  await consumer.consumeAsync('test4', (msg, cb) => {
    messages.push(msg);
    cb();
  });

  await queue.saveAsync('test5', EQueueType.PRIORITY_QUEUE);
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

  await shutDownBaseInstance(consumer);
});
