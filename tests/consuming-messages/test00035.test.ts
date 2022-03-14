import { delay, promisifyAll } from 'bluebird';
import { Consumer } from '../../src/consumer';
import { getProducer } from '../common';
import { Message } from '../../src/system/app/message/message';
import { events } from '../../src/system/common/events';

test('Consume messages from different queues using a single consumer instance: case 6', async () => {
  const messages: Message[] = [];
  const consumer = promisifyAll(new Consumer(true));
  await consumer.runAsync();

  // running without message handlers
  await delay(5000);

  // will do nothing when a message is received
  await consumer.consumeAsync('test0', false, () => void 0);

  consumer.once(events.MESSAGE_RECEIVED, () => {
    setTimeout(() => {
      // cancelling a queue when a message handler is active
      consumer.cancelAsync('test0').catch((e) => {
        console.log(e);
      });
    }, 1000);
  });

  const producer = getProducer();
  await producer.produceAsync(new Message().setQueue('test0').setBody('body'));

  await delay(10000);
  expect(consumer.getQueues()).toEqual([]);

  await consumer.consumeAsync('test1', true, (msg, cb) => {
    messages.push(msg);
    cb();
  });
  await consumer.consumeAsync('test2', true, (msg, cb) => {
    messages.push(msg);
    cb();
  });
  await consumer.consumeAsync('test3', true, (msg, cb) => {
    messages.push(msg);
    cb();
  });
  await consumer.consumeAsync('test4', true, (msg, cb) => {
    messages.push(msg);
    cb();
  });
  await consumer.consumeAsync('test5', true, (msg, cb) => {
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